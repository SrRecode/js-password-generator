import { generatePassword, estimateStrength } from './password.js';

const form = document.getElementById('options');
const output = document.getElementById('password');
const copyBtn = document.getElementById('copy');
const lengthInput = document.getElementById('length');
const lengthValue = document.getElementById('length-value');
const errorEl = document.getElementById('error');
const strengthFill = document.getElementById('strength-fill');
const strengthLabel = document.getElementById('strength-label');

const STRENGTH_COLORS = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'];

function options() {
  return {
    length: Number(lengthInput.value),
    lowercase: document.getElementById('lowercase').checked,
    uppercase: document.getElementById('uppercase').checked,
    numbers: document.getElementById('numbers').checked,
    symbols: document.getElementById('symbols').checked,
    excludeAmbiguous: document.getElementById('excludeAmbiguous').checked,
  };
}

function updateStrength(password) {
  const { score, label, entropy } = estimateStrength(password);
  strengthFill.style.width = `${(score / 4) * 100}%`;
  strengthFill.style.background = STRENGTH_COLORS[score];
  strengthLabel.textContent = password ? `${label} · ${Math.round(entropy)} bits` : '—';
}

async function generate() {
  errorEl.hidden = true;
  try {
    const password = await generatePassword(options());
    output.textContent = password;
    updateStrength(password);
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
    output.textContent = '—';
    updateStrength('');
  }
}

lengthInput.addEventListener('input', () => {
  lengthValue.textContent = lengthInput.value;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  generate();
});

copyBtn.addEventListener('click', async () => {
  const password = output.textContent;
  if (!password || password === '—' || password === 'Click generate') return;
  try {
    await navigator.clipboard.writeText(password);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(output);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
  }
  copyBtn.textContent = 'Copied!';
  copyBtn.classList.add('copied');
  setTimeout(() => {
    copyBtn.textContent = 'Copy';
    copyBtn.classList.remove('copied');
  }, 1500);
});

generate();
