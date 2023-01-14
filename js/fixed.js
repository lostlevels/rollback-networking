const FIXED_FACTOR = 4096;

function toFixed(flt) {
  return Math.floor(flt * FIXED_FACTOR);
}

function fromFixed(fixed) {
  return Math.floor(fixed / FIXED_FACTOR);
}

function mulFixed(a, b) {
  return Math.floor(a * b / FIXED_FACTOR);
}

function divFixed(a, b) {
  return Math.floor(a * FIXED_FACTOR / b);
}
