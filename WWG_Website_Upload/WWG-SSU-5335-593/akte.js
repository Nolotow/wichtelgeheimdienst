
const recipient = "Simone";
const statusEl = document.getElementById('status');
const revealEl = document.getElementById('reveal');
const tapBtn = document.getElementById('tapBtn');

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function playBells() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;

  const ctx = new AudioCtx();
  try {
    if (ctx.state === 'suspended') await ctx.resume();
  } catch(e) {}

  if (ctx.state !== 'running') {
    try { await ctx.close(); } catch(e) {}
    return false;
  }

  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  function bell(freq, when, dur=1.7) {
    const partials = [1, 2.01, 2.72, 3.95];
    const gains = [1, .38, .20, .10];
    partials.forEach((m, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq*m, when);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gains[i]*0.32, when+0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, when+dur);
      osc.connect(g); g.connect(master);
      osc.start(when); osc.stop(when+dur+0.05);
    });
  }

  const now = ctx.currentTime + 0.05;
  // short Christmas-like chime motif
  [
    [659.25,0.00],[659.25,0.22],[659.25,0.44],
    [659.25,0.86],[659.25,1.08],[659.25,1.30],
    [659.25,1.74],[783.99,1.96],[523.25,2.18],[587.33,2.40],[659.25,2.62]
  ].forEach(([f,t]) => bell(f, now+t, 1.35));

  await sleep(4300);
  try { await ctx.close(); } catch(e) {}
  return true;
}

async function revealSequence(fromTap=false) {
  tapBtn.classList.remove('show');
  statusEl.textContent = 'Authentifizierung der Wichtelakte …';
  await sleep(900);

  const played = await playBells();
  if (!played && !fromTap) {
    statusEl.textContent = 'Tonwiedergabe wurde vom Browser gesperrt.';
    tapBtn.classList.add('show');
    return;
  }

  statusEl.textContent = 'Zuteilung entschlüsselt.';
  await sleep(450);
  document.getElementById('name').textContent = recipient;
  revealEl.classList.add('show');
}

tapBtn.addEventListener('click', () => revealSequence(true));

// Try automatically. Mobile browsers may block sound until the first tap.
window.addEventListener('load', () => setTimeout(() => revealSequence(false), 650));
