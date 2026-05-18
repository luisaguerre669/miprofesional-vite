const MAX_ERRORS = 100;

const errors = [];

function push(errData) {
  errors.push({ ...errData, timestamp: new Date().toISOString() });
  if (errors.length > MAX_ERRORS) errors.shift();
}

function list(limit = 20) {
  return errors.slice(-limit).reverse();
}

function count() {
  return { total: errors.length, lastMinute: errors.filter(e => Date.now() - new Date(e.timestamp).getTime() < 60000).length };
}

function clear() {
  errors.length = 0;
}

module.exports = { push, list, count, clear };
