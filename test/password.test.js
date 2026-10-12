import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARACTER_SETS,
  buildAlphabet,
  estimateStrength,
  generatePassword,
} from '../src/password.js';

// Deterministic little LCG so tests never depend on the platform RNG.
function seededRng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test('respects the requested length', async () => {
  for (const length of [1, 8, 16, 64, 128]) {
    const password = await generatePassword({ length }, seededRng(length));
    assert.equal(password.length, length);
  }
});

test('only uses characters from the enabled sets', async () => {
  const password = await generatePassword(
    { length: 200, lowercase: true, uppercase: false, numbers: true, symbols: false },
    seededRng(7),
  );
  assert.match(password, /^[a-z0-9]+$/);
});

test('includes at least one character from every enabled set', async () => {
  const password = await generatePassword(
    { length: 40, lowercase: true, uppercase: true, numbers: true, symbols: true },
    seededRng(3),
  );
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[^a-zA-Z0-9]/);
});

test('excludes ambiguous characters when asked', async () => {
  const password = await generatePassword(
    { length: 300, excludeAmbiguous: true },
    seededRng(11),
  );
  assert.doesNotMatch(password, /[Il1O0o]/);
});

test('throws when no character set is selected', async () => {
  await assert.rejects(
    () =>
      generatePassword(
        { lowercase: false, uppercase: false, numbers: false, symbols: false },
        seededRng(1),
      ),
    /at least one character set/,
  );
});

test('rejects a non-positive length', async () => {
  await assert.rejects(() => generatePassword({ length: 0 }), /at least 1/);
});

test('buildAlphabet throws without sets and otherwise joins them', () => {
  assert.throws(() => buildAlphabet({ lowercase: false, uppercase: false, numbers: false, symbols: false }));
  const { chars } = buildAlphabet({ lowercase: true, uppercase: false, numbers: false, symbols: false });
  assert.equal(chars, CHARACTER_SETS.lowercase);
});

test('estimateStrength scores by entropy', () => {
  assert.equal(estimateStrength('').score, 0);
  assert.equal(estimateStrength('abc').score, 0);
  assert.ok(estimateStrength('Tr0ub4dor&3xY9pQm!').score >= 3);
  const long = estimateStrength('correct horse battery staple 42!');
  assert.equal(long.score, 4);
  assert.equal(long.label, 'Very strong');
});
