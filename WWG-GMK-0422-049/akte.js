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
  master.gain.value = .22;
  master.connect(ctx.destination);

  function bell(freq, when, dur=1.5){
    const partials=[1,2.01,2.72,3.95], gains=[1,.38,.20,.10];
    partials.forEach((m,i)=>{
      const osc=ctx.createOscillator(), g=ctx.createGain();
      osc.type="sine"; osc.frequency.setValueAtTime(freq*m,when);
      g.gain.setValueAtTime(.0001,when);
      g.gain.exponentialRampToValueAtTime(gains[i]*.32,when+.015);
      g.gain.exponentialRampToValueAtTime(.0001,when+dur);
      osc.connect(g); g.connect(master); osc.start(when); osc.stop(when+dur+.05);
    });
  }

  const now=ctx.currentTime+.05;
  [[659.25,0],[659.25,.22],[659.25,.44],[659.25,.86],[659.25,1.08],
   [659.25,1.30],[659.25,1.74],[783.99,1.96],[523.25,2.18],
   [587.33,2.40],[659.25,2.62]].forEach(([f,t])=>bell(f,now+t));

  await sleep(4200);
  try{ await ctx.close(); }catch(e){}
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
