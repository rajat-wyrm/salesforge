// Rollup metrics: counters, gauges, histograms.
class Metrics {
  constructor() { this.counters = new Map(); this.gauges = new Map(); this.histograms = new Map(); }
  inc(name, n = 1) { this.counters.set(name, (this.counters.get(name) || 0) + n); }
  gauge(name, v) { this.gauges.set(name, v); }
  observe(name, v) {
    if (!this.histograms.has(name)) this.histograms.set(name, []);
    this.histograms.get(name).push(v);
  }
  snapshot() {
    const out = { counters: {}, gauges: {}, histograms: {} };
    for (const [k, v] of this.counters) out.counters[k] = v;
    for (const [k, v] of this.gauges) out.gauges[k] = v;
    for (const [k, arr] of this.histograms) {
      const sorted = [...arr].sort((a, b) => a - b);
      const pick = (q) => sorted[Math.floor((sorted.length - 1) * q)] || 0;
      out.histograms[k] = { count: arr.length, p50: pick(0.5), p95: pick(0.95), p99: pick(0.99) };
    }
    return out;
  }
  reset() { this.counters.clear(); this.gauges.clear(); this.histograms.clear(); }
}

module.exports = new Metrics();
