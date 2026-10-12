// Secure password generation and strength estimation.
//
// The generator is isomorphic: in the browser it uses `window.crypto`, and in
// Node it falls back to `node:crypto`'s webcrypto. A random number source can
// be injected so behaviour is fully testable.

export const CHARACTER_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};

const AMBIGUOUS = new Set('Il1O0o');

export const DEFAULT_OPTIONS = {
  length: 16,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

let cachedRng = null;

/** Cryptographically strong float in [0, 1) using a platform RNG. */
async function platformRandom() {
  if (!cachedRng) {
    const cryptoObj =
      globalThis.crypto ??
      (await import('node:crypto')).webcrypto;
    const buffer = new Uint32Array(1);
    cachedRng = () => {
      // Rejection sampling keeps the distribution uniform.
      const limit = 0xffffffff - (0x100000000 % 0x100000000);
      let value;
      do {
        cryptoObj.getRandomValues(buffer);
        value = buffer[0];
      } while (value >= limit);
      return value / 0x100000000;
    };
  }
  return cachedRng();
}

function normalize(options) {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const num = Math.floor(Number(merged.length));
  merged.length = Number.isFinite(num) ? num : DEFAULT_OPTIONS.length;
  return merged;
}

/** The union of every enabled character set, optionally minus ambiguous chars. */
export function buildAlphabet(options = {}) {
  const opts = normalize(options);
  const enabled = Object.keys(CHARACTER_SETS).filter((key) => opts[key]);
  if (enabled.length === 0) {
    throw new Error('Select at least one character set');
  }
  let chars = enabled.map((key) => CHARACTER_SETS[key]).join('');
  if (opts.excludeAmbiguous) {
    chars = chars
      .split('')
      .filter((char) => !AMBIGUOUS.has(char))
      .join('');
  }
  return { chars, sets: enabled.map((key) => CHARACTER_SETS[key].split('')) };
}

/**
 * Estimate password strength from its length and character variety.
 * @returns {{ entropy: number, score: 0|1|2|3|4, label: string }}
 */
export function estimateStrength(password) {
  if (!password) return { entropy: 0, score: 0, label: 'Empty' };

  let alphabetSize = 0;
  if (/[a-z]/.test(password)) alphabetSize += 26;
  if (/[A-Z]/.test(password)) alphabetSize += 26;
  if (/[0-9]/.test(password)) alphabetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) alphabetSize += CHARACTER_SETS.symbols.length;

  const entropy = password.length * Math.log2(alphabetSize || 1);
  let score = 0;
  let label = 'Very weak';
  if (entropy >= 80) {
    score = 4;
    label = 'Very strong';
  } else if (entropy >= 60) {
    score = 3;
    label = 'Strong';
  } else if (entropy >= 40) {
    score = 2;
    label = 'Medium';
  } else if (entropy >= 25) {
    score = 1;
    label = 'Weak';
  }
  return { entropy, score, label };
}

/**
 * Generate a password.
 * @param {Partial<typeof DEFAULT_OPTIONS>} [options]
 * @param {() => number} [rng] float source in [0, 1) — defaults to the platform RNG.
 * @returns {Promise<string>}
 */
export async function generatePassword(options = {}, rng) {
  const opts = normalize(options);
  if (opts.length < 1) throw new Error('Length must be at least 1');

  const { chars, sets } = buildAlphabet(opts);
  const random = rng ?? platformRandom;
  const pick = (source) => source[Math.floor(random() * source.length)];

  const result = [];

  // Guarantee at least one character from each selected set (as space allows).
  const required = sets.filter((set) => {
    const pool = opts.excludeAmbiguous
      ? set.filter((c) => !AMBIGUOUS.has(c))
      : set;
    return pool.length > 0;
  });
  for (let i = 0; i < Math.min(opts.length, required.length); i += 1) {
    result.push(pick(required[i]));
  }

  while (result.length < opts.length) {
    result.push(pick(chars.split('')));
  }

  // Fisher-Yates shuffle so the guaranteed characters are not positionally biased.
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}
