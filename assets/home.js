
const VALID_CASES = new Set(["WWG-PIK-2264-364", "WWG-FXM-3531-803", "WWG-RWP-6425-137", "WWG-IQR-0488-147", "WWG-YEI-4716-916", "WWG-VMB-6184-510", "WWG-SSU-5335-593", "WWG-FBU-0498-434", "WWG-GMK-0422-049"]);
const target = new Date("2026-12-24T00:00:00+01:00").getTime();

function pad(n, len=2) {
  return String(n).padStart(len, "0");
}

function updateCountdown() {
  let diff = target - Date.now();
  const el = document.getElementById("countdown");
  if (diff <= 0) {
    el.textContent = "000:00:00:00:000";
    return;
  }
  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  const milliseconds = diff % 1000;

  el.textContent =
    pad(days, 3) + ":" +
    pad(hours) + ":" +
    pad(minutes) + ":" +
    pad(seconds) + ":" +
    pad(milliseconds, 3);
}

setInterval(updateCountdown, 31);
updateCountdown();

const form = document.getElementById("caseForm");
const input = document.getElementById("caseInput");
const error = document.getElementById("caseError");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const normalized = input.value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");

  if (VALID_CASES.has(normalized)) {
    window.location.href = "/" + normalized + "/?src=manual";
    return;
  }

  error.textContent = "Aktenzeichen unbekannt oder ungültig.";
  input.focus();
});

input.addEventListener("input", () => {
  error.textContent = "";
});


// Verdeckter Zugang zur Behördenleitung
(() => {
  const btn=document.getElementById('adminLogoBtn');
  const modal=document.getElementById('adminModal');
  const close=document.getElementById('adminClose');
  const form=document.getElementById('adminLoginForm');
  const pass=document.getElementById('adminPassphrase');
  const error=document.getElementById('adminLoginError');
  if(!btn||!modal||!form) return;
  const open=()=>{modal.classList.add('show');modal.setAttribute('aria-hidden','false');error.textContent='';pass.value='';setTimeout(()=>pass.focus(),50)};
  const shut=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true')};
  btn.addEventListener('click',open); close.addEventListener('click',shut);
  modal.addEventListener('click',e=>{if(e.target===modal) shut()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') shut()});
  if(new URLSearchParams(location.search).get('admin')==='1') open();
  form.addEventListener('submit',async e=>{
    e.preventDefault(); error.textContent='Legitimation wird geprüft …';
    const API=String(window.WWG_BACKEND_URL||'').replace(/\/$/,'');
    if(!API||API.includes('DEIN-WWG-WORKER')){error.textContent='Backend noch nicht eingerichtet.';return}
    try{
      const res=await fetch(API+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passphrase:pass.value})});
      if(!res.ok){error.textContent='Legitimation abgelehnt.';return}
      const data=await res.json();
      sessionStorage.setItem('wwg_admin_token',data.token);
      location.href='/behoerdenleitung/';
    }catch(_){error.textContent='Verbindung zur Behördenleitung fehlgeschlagen.'}
  });
})();
