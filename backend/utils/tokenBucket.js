// Simple token bucket for soft throttling.
class TokenBucket {
  constructor({ capacity = 100, refillPerSec = 10 } = {}) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity;
    this.last = Date.now();
  }
  take(n = 1) {
    this._refill();
    if (this.tokens >= n) { this.tokens -= n; return true; }
    return false;
  }
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSec);
    this.last = now;
  }
}

const buckets = new Map();
const get = (key, opts) => {
  if (!buckets.has(key)) buckets.set(key, new TokenBucket(opts));
  return buckets.get(key);
};

module.exports = { TokenBucket, get };
