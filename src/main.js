import { generateTOTP, getRemainingSeconds } from './totp.js';
import './style.css';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TIME_STEP = 30;

document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1 class="title">Authenticator</h1>
    <p class="subtitle">Paste your 2FA secret below</p>

    <div class="input-group">
      <input
        id="secret"
        type="text"
        placeholder="e.g. JBSWY3DPEHPK3PXP"
        autocomplete="off"
        spellcheck="false"
      />
    </div>

    <div id="output" class="output hidden">
      <div class="ring-wrap">
        <svg class="ring" viewBox="0 0 120 120">
          <circle class="ring-bg"  cx="60" cy="60" r="${RADIUS}" />
          <circle class="ring-fg"  cx="60" cy="60" r="${RADIUS}" id="ring-fg"
            stroke-dasharray="${CIRCUMFERENCE}"
            stroke-dashoffset="0" />
        </svg>
        <span class="countdown" id="countdown"></span>
      </div>
      <span class="code" id="code">------</span>
      <button class="copy-btn" id="copy" title="Copy to clipboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>

    <p id="error" class="error hidden"></p>

    <p class="note">Nothing is stored. Reload to clear.</p>
  </div>
`;

/* ---- DOM refs ---- */
const secretInput = document.getElementById('secret');
const outputEl     = document.getElementById('output');
const codeEl       = document.getElementById('code');
const countdownEl  = document.getElementById('countdown');
const ringFg       = document.getElementById('ring-fg');
const copyBtn      = document.getElementById('copy');
const errorEl      = document.getElementById('error');

let tickTimer = null;
let currentSecret = '';

/* ---- Helpers ---- */
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
  outputEl.classList.add('hidden');
}
function clearError() {
  errorEl.classList.add('hidden');
}

/* ---- Core loop ---- */
async function tick() {
  try {
    const code = await generateTOTP(currentSecret, TIME_STEP);
    const remaining = getRemainingSeconds(TIME_STEP);

    /* Animate code change */
    if (codeEl.textContent !== code.slice(0, 3) + ' ' + code.slice(3)) {
      codeEl.classList.remove('pop');
      void codeEl.offsetWidth;
      codeEl.classList.add('pop');
    }

    codeEl.textContent = code.slice(0, 3) + ' ' + code.slice(3);
    countdownEl.textContent = remaining;

    const progress = (TIME_STEP - remaining) / TIME_STEP;
    ringFg.style.strokeDashoffset = CIRCUMFERENCE * progress;

    /* Urgency class when ≤ 5 s */
    outputEl.classList.toggle('urgent', remaining <= 5);
  } catch {
    showError('Could not generate code — check your secret.');
    stop();
  }
}

function start(secret) {
  currentSecret = secret;
  clearError();
  outputEl.classList.remove('hidden');
  tick();
  tickTimer = setInterval(tick, 500);
}

function stop() {
  clearInterval(tickTimer);
  tickTimer = null;
  codeEl.textContent = '------';
}

/* ---- Events ---- */
secretInput.addEventListener('input', () => {
  const raw = secretInput.value.replace(/\s+/g, '');
  if (!raw) {
    stop();
    outputEl.classList.add('hidden');
    clearError();
    return;
  }
  if (raw !== currentSecret) {
    stop();
    start(raw);
  }
});

copyBtn.addEventListener('click', () => {
  const text = codeEl.textContent.replace(/\s/g, '');
  if (!text || text === '------') return;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.classList.add('copied');
    setTimeout(() => copyBtn.classList.remove('copied'), 1200);
  });
});
