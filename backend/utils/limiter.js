'use strict';

function createLimiter(max = 2) {
  max = Math.max(1, Number(max) || 1);
  let active = 0;
  const queue = [];

  function next() {
    if (active >= max) return;
    const item = queue.shift();
    if (!item) return;
    active++;
    const { fn, resolve, reject } = item;
    Promise.resolve()
      .then(fn)
      .then(
        (value) => {
          active--;
          resolve(value);
          next();
        },
        (err) => {
          active--;
          reject(err);
          next();
        }
      );
  }

  return function run(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
        process.nextTick(next);
      } else if (typeof setImmediate === 'function') {
        setImmediate(next);
      } else {
        setTimeout(next, 0);
      }
    });
  };
}

module.exports = { createLimiter };
