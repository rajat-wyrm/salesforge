// Defer wrapper for non-critical background work.
const queue = [];
let running = false;

const defer = (fn) => new Promise((resolve, reject) => {
  queue.push({ fn, resolve, reject });
  if (!running) drain();
});

const drain = async () => {
  if (running) return;
  running = true;
  while (queue.length) {
    const { fn, resolve, reject } = queue.shift();
    try { resolve(await fn()); } catch (e) { reject(e); }
  }
  running = false;
};

const size = () => queue.length;

module.exports = { defer, drain, size };
