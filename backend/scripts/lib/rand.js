// Random numbers for the simulators, the smoothing evaluation and the tests.

// Reproducible uniform numbers in [0, 1) from a seed (mulberry32).
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A standard normal number (Box-Muller) from a uniform source such as rng(seed) or Math.random.
const gauss = (rand = Math.random) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

// GPS error is quoted as a mean distance; a 2-D Gaussian error with standard deviation sigma per axis has mean sigma * 1.2533.
const sigmaForMeanError = (meanM) => meanM / 1.2533;

module.exports = { rng, gauss, sigmaForMeanError };
