// Locking primitive for short critical sections.
const held = new Map();

const withLock = async (key, fn) => {
  while (held.get(key)) {
    await new Promise((r) => setTimeout(r, 5));
  }
  held.set(key, true);
  try { return await fn(); }
  finally { held.delete(key); }
};

module.exports = { withLock };
