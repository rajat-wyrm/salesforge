// Simple in-memory LRU cache with TTL. Zero dependencies, ~50 lines.
// For production scale, swap with Redis. The interface stays the same.
class TTLCache {
  constructor({ maxSize = 1000, defaultTTL = 60_000 } = {}) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.store = new Map();
    this.timers = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) { this.stats.misses++; return undefined; }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.timers.delete(key);
      this.stats.misses++;
      return undefined;
    }
    // Move to end (LRU)
    this.store.delete(key);
    this.store.set(key, entry);
    this.stats.hits++;
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    this.timers.set(key, setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
      this.stats.evictions++;
    }, ttl));
    this.stats.sets++;
    if (this.store.size > this.maxSize) {
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
      this.timers.delete(firstKey);
      this.stats.evictions++;
    }
    return value;
  }

  delete(key) { this.store.delete(key); this.timers.delete(key); }
  clear() { this.store.clear(); this.timers.forEach((t) => clearTimeout(t)); this.timers.clear(); }
  size() { return this.store.size; }
  getStats() { return { ...this.stats, size: this.store.size }; }
}

const cache = new TTLCache({ maxSize: 2000, defaultTTL: 60_000 });

// Middleware: cache GET responses for `duration` seconds.
const cacheMiddleware = (duration = 30) => (req, res, next) => {
  if (req.method !== "GET") return next();
  const key = `__cache__:${req.originalUrl}`;
  const cached = cache.get(key);
  if (cached) {
    res.setHeader("x-cache", "HIT");
    return res.json(cached);
  }
  res.setHeader("x-cache", "MISS");
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) cache.set(key, body, duration * 1000);
    return originalJson(body);
  };
  next();
};

const invalidateCache = (pattern) => {
  for (const key of cache.store.keys()) {
    if (typeof key === "string" && key.includes(pattern)) cache.delete(key);
  }
};

module.exports = { cache, cacheMiddleware, invalidateCache, TTLCache };
