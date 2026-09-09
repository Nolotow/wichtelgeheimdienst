(()=>{
const form=document.querySelector('#app'),steps=[...document.querySelectorAll('.step')],next=document.querySelector('#next'),back=document.querySelector('#back'),cv=document.querySelector('#cv'),fe=document.querySelector('#fileErr'),send=document.querySelector('#sending'),bar=document.querySelector('#bar'),status=document.querySelector('#status'),fatal=document.querySelector('#fatal'),again=document.querySelector('#again');
let n=0,failures=0;
const initialRef=new URLSearchParams(location.search).get('stelle')||'';
document.querySelector('#ref').value=initialRef;
const stages=[[150,14,'Bewerbung wird übermittelt …'],[1700,37,'Unterlagen werden auf Vollständigkeit geprüft …'],[3600,61,'Zuständigkeit wird ermittelt …'],[5700,83,'Verbindung zur Personalstelle wird hergestellt …'],[8200,97,'Abschluss der Übermittlung …']];
let timers=[];
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function show(){steps.forEach((s,i)=>s.classList.toggle('active',i===n));back.style.visibility=n?'visible':'hidden';next.textContent=n===steps.length-1?'Jetzt bewerben!':'Weiter';scrollTo({top:0,behavior:'smooth'})}
function valid(){const els=[...steps[n].querySelectorAll('input,select,textarea')];for(const e of els){if(!e.checkValidity()){e.reportValidity();return false}}if(n===steps.length-1&&cv.files[0]&&cv.files[0].size>1048576){fe.textContent='Die ausgewählte Datei überschreitet die zulässige Dateigröße von 1 MB.';return false}return true}
function resetToStart(){
  clearTimers();
  form.reset();
  // Absichtlich vollständig leer: auch die zuvor aus der Stellenausschreibung übernommene Kennziffer wird verworfen.
  document.querySelector('#ref').value='';
  fe.textContent='';
  n=0;failures=0;
  fatal.hidden=true;send.hidden=true;form.hidden=false;
  bar.style.transition='none';bar.style.width='0';void bar.offsetWidth;bar.style.transition='width 1.3s ease';status.textContent='';
  show();
  window.scrollTo({top:0,behavior:'smooth'});
}
function transmit(){
  clearTimers();
  form.hidden=true;fatal.hidden=true;send.hidden=false;
  bar.style.transition='none';bar.style.width='0';void bar.offsetWidth;bar.style.transition='width 1.3s ease';status.textContent='';
  stages.forEach(([t,p,s])=>timers.push(setTimeout(()=>{bar.style.width=p+'%';status.textContent=s},t)));
  timers.push(setTimeout(()=>{
    send.hidden=true;fatal.hidden=false;failures++;
    window.scrollTo({top:0,behavior:'smooth'});
    if(failures>=3){
      // Die dritte Fehlermeldung bleibt kurz sichtbar; anschließend beginnt das Verfahren wieder ganz von vorn.
      timers.push(setTimeout(resetToStart,3200));
    }
  },11200));
}
cv.addEventListener('change',()=>{fe.textContent=cv.files[0]&&cv.files[0].size>1048576?'Die ausgewählte Datei überschreitet die zulässige Dateigröße von 1 MB.':''});
document.querySelector('#moreDocs').onclick=e=>{e.preventDefault()};
back.onclick=()=>{if(n){n--;show()}};
next.onclick=()=>{if(!valid())return;if(n<steps.length-1){n++;show();return}transmit()};
again.onclick=()=>{if(failures<3)transmit()};
show();
})();