// Centralized metrics collection. Counters + gauges + histograms in memory.
// For production, export to Prometheus / OpenTelemetry.
class Metrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startedAt = Date.now();
  }

  inc(name, value = 1, labels = {}) {
    const key = this.key(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  dec(name, value = 1, labels = {}) {
    this.inc(name, -value, labels);
  }

  gauge(name, value, labels = {}) {
    this.gauges.set(this.key(name, labels), value);
  }

  observe(name, value, labels = {}) {
    const key = this.key(name, labels);
    if (!this.histograms.has(key)) this.histograms.set(key, []);
    const h = this.histograms.get(key);
    h.push(value);
    if (h.length > 1000) h.shift();
  }

  key(name, labels) {
    const labelStr = Object.keys(labels).sort().map((k) => `${k}=${labels[k]}`).join(",");
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  snapshot() {
    const counters = {};
    for (const [k, v] of this.counters) counters[k] = v;
    const gauges = {};
    for (const [k, v] of this.gauges) gauges[k] = v;
    const histograms = {};
    for (const [k, values] of this.histograms) {
      if (!values.length) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      histograms[k] = {
        count: sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round((sum / sorted.length) * 100) / 100,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }
    return {
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      counters,
      gauges,
      histograms,
    };
  }
}

module.exports = new Metrics();
