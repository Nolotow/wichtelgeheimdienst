const recipient = "Maximilian";

const statusEl = document.getElementById("status");
const progressEl = document.querySelector("#progress span");
const tapBtn = document.getElementById("tapBtn");
const jurisdictionEl = document.getElementById("jurisdiction");
const authorizationEl = document.getElementById("authorization");
const revealEl = document.getElementById("reveal");
const nameEl = document.getElementById("name");
const fileStateEl = document.getElementById("fileState");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function setStep(text, progress){
  statusEl.textContent = text;
  progressEl.style.width = `${progress}%`;
}

async function playSignal(){
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if(!AudioCtx) return;
  const ctx = new AudioCtx();
  if(ctx.state === "suspended") await ctx.resume();

  const master = ctx.createGain();
  master.gain.value = .11;
  master.connect(ctx.destination);

  const notes = [659.25, 783.99, 987.77, 783.99];
  const now = ctx.currentTime + .04;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, now + i * .18);
    gain.gain.exponentialRampToValueAtTime(.16, now + i * .18 + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, now + i * .18 + .55);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + i * .18);
    osc.stop(now + i * .18 + .6);
  });

  await sleep(1100);
  try { await ctx.close(); } catch(_) {}
}

async function openFile(){
  tapBtn.disabled = true;
  tapBtn.hidden = true;
  fileStateEl.textContent = "Em processamento";

  setStep("Verificando identidade da pessoa autorizada …", 22);
  await sleep(900);
  setStep("Idioma administrativo registrado: Português (Brasil).", 34);
  await sleep(900);
  setStep("Consultando cadastro internacional de residência …", 46);
  await sleep(1000);
  setStep("Alteração de jurisdição natalina detectada.", 58);
  await sleep(850);

  jurisdictionEl.hidden = false;
  jurisdictionEl.scrollIntoView({behavior:"smooth", block:"nearest"});
  await sleep(1500);

  setStep("Redistribuindo o processo ao Setor Lusófono / Mediterrâneo …", 72);
  await sleep(1050);
  setStep("Verificando competência regional da Catalunya …", 84);
  await sleep(950);
  setStep("Competência confirmada. Autorização de acesso válida.", 94);
  await sleep(700);

  authorizationEl.hidden = false;
  await playSignal();

  setStep("Deslacrando a designação natalina …", 100);
  await sleep(850);

  nameEl.textContent = recipient;
  revealEl.hidden = false;
  fileStateEl.textContent = "Acesso autorizado";
  statusEl.textContent = "Processo aberto. Designação individual liberada.";
  revealEl.scrollIntoView({behavior:"smooth", block:"center"});
}

window.addEventListener("load", async () => {
  document.documentElement.lang = "pt-BR";
  setStep("Autenticando processo WWG-GMK-0422-049 …", 8);
  await sleep(900);
  setStep("Credenciais reconhecidas. Deslacração manual obrigatória.", 14);
  fileStateEl.textContent = "Autenticação concluída";
  tapBtn.hidden = false;
});

tapBtn.addEventListener("click", openFile);
