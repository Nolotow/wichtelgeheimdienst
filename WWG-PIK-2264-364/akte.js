const recipient = "Camilla";

const statusEl = document.getElementById("status");
const revealEl = document.getElementById("reveal");
const tapBtn = document.getElementById("tapBtn");
const nameEl = document.getElementById("name");

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

async function playBells(){
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
  if(window.WWG_TRACK) window.WWG_TRACK('unlock');
  tapBtn.classList.remove("show");
  statusEl.textContent="Identität wird überprüft …";
  await sleep(1000);
  statusEl.textContent="Wichtelakte wird entschlüsselt …";
  await sleep(900);
  // Der Glockenton ist nur ein Effekt. Mobile Browser können AudioContext
  // blockieren oder dauerhaft im Status „suspended“ halten. Die Aktenfreigabe
  // darf deshalb niemals auf die Audiowiedergabe warten.
  try{ playBells().catch(()=>{}); }catch(e){}

  statusEl.textContent="Zuteilung erfolgreich entschlüsselt.";
  await sleep(700);
  nameEl.textContent=recipient;
  revealEl.classList.add("show");
  if(window.WWG_TRACK) window.WWG_TRACK('reveal');
  statusEl.textContent="";
}

window.addEventListener("load", async ()=>{
  statusEl.textContent="Authentifizierung der Wichtelakte …";
  await sleep(1200);
  statusEl.textContent="Sicherheitsfreigabe erforderlich.";
  tapBtn.textContent="AKTE ENTSIEGELN";
  tapBtn.classList.add("show");
});

tapBtn.addEventListener("click", openFile);
