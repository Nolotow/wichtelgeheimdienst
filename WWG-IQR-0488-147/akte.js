
const recipient = "Jörg-Peter";
const statusEl = document.getElementById("status");
const revealEl = document.getElementById("reveal");
const tapBtn = document.getElementById("tapBtn");
const nameEl = document.getElementById("name");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function playBells() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtx) {
    return;
  }

  const ctx = new AudioCtx();

  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  function bell(freq, when, dur = 1.5) {
    const partials = [1, 2.01, 2.72, 3.95];
    const gains = [1, 0.38, 0.20, 0.10];

    partials.forEach((multiplier, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * multiplier, when);

      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(
        gains[i] * 0.32,
        when + 0.015
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        when + dur
      );

      osc.connect(gain);
      gain.connect(master);

      osc.start(when);
      osc.stop(when + dur + 0.05);
    });
  }

  const now = ctx.currentTime + 0.05;

  const melody = [
    [659.25, 0.00],
    [659.25, 0.22],
    [659.25, 0.44],

    [659.25, 0.86],
    [659.25, 1.08],
    [659.25, 1.30],

    [659.25, 1.74],
    [783.99, 1.96],
    [523.25, 2.18],
    [587.33, 2.40],
    [659.25, 2.62]
  ];

  melody.forEach(([frequency, time]) => {
    bell(frequency, now + time);
  });

  await sleep(4200);

  try {
    await ctx.close();
  } catch (e) {}
}

async function openFile() {
  tapBtn.classList.remove("show");

  statusEl.textContent = "Identität wird überprüft …";
  await sleep(1000);

  statusEl.textContent = "Wichtelakte wird entschlüsselt …";
  await sleep(900);

  try {
    await playBells();
  } catch (error) {
    console.log("Audio konnte nicht abgespielt werden:", error);
    await sleep(1000);
  }

  statusEl.textContent = "Zuteilung erfolgreich entschlüsselt.";

  await sleep(700);

  nameEl.textContent = recipient;
  revealEl.classList.add("show");

  statusEl.textContent = "";
}

window.addEventListener("load", async () => {
  statusEl.textContent = "Authentifizierung der Wichtelakte …";

  await sleep(1200);

  statusEl.textContent =
    "Sicherheitsfreigabe erforderlich.";

  tapBtn.textContent =
    "AKTE ENTSIEGELN";

  tapBtn.classList.add("show");
});

tapBtn.addEventListener("click", openFile);
