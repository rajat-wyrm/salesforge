// Simple in-process pub/sub for event bus.
const subscribers = new Map();

const subscribe = (event, handler) => {
  if (!subscribers.has(event)) subscribers.set(event, new Set());
  subscribers.get(event).add(handler);
  return () => subscribers.get(event)?.delete(handler);
};

const publish = (event, payload) => {
  const subs = subscribers.get(event);
  if (!subs) return 0;
  for (const handler of subs) {
    try { handler(payload); } catch (_) { /* swallow */ }
  }
  return subs.size;
};

const clear = () => subscribers.clear();

module.exports = { subscribe, publish, clear };
