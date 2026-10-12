# js-password-generator

A secure random password generator built with **vanilla JavaScript** — no dependencies, no build step, and nothing ever leaves your browser. Randomness comes from the platform's cryptographic RNG (`window.crypto` in the browser, `node:crypto` under Node).

## Features

- **Cryptographically strong randomness** via `crypto.getRandomValues`, with rejection sampling for a uniform distribution.
- **Configurable length** (4–64) and character sets — lowercase, uppercase, numbers, symbols.
- **Guarantees a character from every enabled set** (shuffled so it isn't positionally biased).
- **Exclude look-alike characters** (`I l 1 O 0 o`) for easy transcription.
- **Live strength meter** with an entropy estimate in bits.
- **One-click copy** with a graceful fallback for older browsers.
- **Clear validation** — you can't generate from zero character sets or a zero length.

## Getting started

```sh
# Option 1
start index.html        # Windows
open index.html         # macOS

# Option 2 (needed for the ES module import in some browsers)
npx --yes serve .
```

## Running the tests

```sh
npm test
```

```
> js-password-generator@1.0.0 test
> node --test

✔ respects the requested length
✔ only uses characters from the enabled sets
✔ includes at least one character from every enabled set
✔ excludes ambiguous characters when asked
✔ throws when no character set is selected
✔ rejects a non-positive length
✔ buildAlphabet throws without sets and otherwise joins them
✔ estimateStrength scores by entropy
```

The tests inject a **seeded RNG**, so they are deterministic and never depend on the platform's random source.

## Project structure

```
js-password-generator/
├── index.html              # Markup: output, strength meter, options
├── styles.css              # Dark theme
├── src/
│   ├── password.js         # Generation + strength logic (tested)
│   └── ui.js               # DOM wiring, copy to clipboard
├── test/
│   └── password.test.js    # node:test unit tests
├── package.json
└── README.md
```

### Security notes

- Random values come from the OS CSPRNG, **not** `Math.random`.
- Passwords are generated entirely client-side; the page makes no network requests.
- The "`bits`" figure on the strength meter is `length × log2(alphabet size)` — a useful proxy, not a guarantee.

## Tech

- Vanilla JavaScript (ES modules)
- Web Crypto API (`crypto.getRandomValues`)
- HTML5 `<output>`, `<range>`, `<fieldset>`
- Node's built-in `node:test`

## License

MIT
