// Background job queue with retry logic. Zero dependencies.
// Jobs are persisted in memory with optional disk persistence hook.
const { EventEmitter } = require("events");
const crypto = require("crypto");

class JobQueue extends EventEmitter {
  constructor({ concurrency = 4, maxRetries = 3, retryDelay = 1000 } = {}) {
    super();
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.queue = [];
    this.processing = new Map();
    this.completed = new Map();
    this.failed = new Map();
    this.handlers = new Map();
  }

  register(name, handler) {
    this.handlers.set(name, handler);
    return this;
  }

  enqueue(name, payload = {}, { delay = 0, priority = 0, maxRetries } = {}) {
    const job = {
      id: crypto.randomUUID(),
      name,
      payload,
      priority,
      attempts: 0,
      maxRetries: maxRetries ?? this.maxRetries,
      status: "pending",
      enqueuedAt: Date.now(),
      scheduledFor: Date.now() + delay,
    };
    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.emit("enqueued", job);
    setImmediate(() => this.process());
    return job.id;
  }

  async process() {
    if (this.processing.size >= this.concurrency) return;
    const now = Date.now();
    const idx = this.queue.findIndex((j) => j.scheduledFor <= now && j.status === "pending");
    if (idx === -1) return;
    const job = this.queue.splice(idx, 1)[0];
    this.processing.set(job.id, job);
    job.status = "processing";
    job.startedAt = Date.now();
    this.emit("processing", job);
    try {
      const handler = this.handlers.get(job.name);
      if (!handler) throw new Error(`No handler for job: ${job.name}`);
      await handler(job.payload, job);
      job.status = "completed";
      job.completedAt = Date.now();
      this.completed.set(job.id, job);
      this.processing.delete(job.id);
      this.emit("completed", job);
    } catch (err) {
      job.attempts += 1;
      job.lastError = err.message;
      if (job.attempts < job.maxRetries) {
        job.status = "retrying";
        job.scheduledFor = Date.now() + this.retryDelay * Math.pow(2, job.attempts - 1);
        this.queue.push(job);
        this.queue.sort((a, b) => b.priority - a.priority);
        this.processing.delete(job.id);
        this.emit("retrying", job);
      } else {
        job.status = "failed";
        job.failedAt = Date.now();
        this.failed.set(job.id, job);
        this.processing.delete(job.id);
        this.emit("failed", job);
      }
    }
    if (this.queue.length > 0) setImmediate(() => this.process());
  }

  getStats() {
    return {
      pending: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
    };
  }
}

module.exports = new JobQueue({ concurrency: 4, maxRetries: 3, retryDelay: 1000 });
