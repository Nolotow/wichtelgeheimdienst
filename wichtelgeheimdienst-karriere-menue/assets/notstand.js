const form=document.getElementById('emergencyForm');
const transfer=document.getElementById('transfer');
const title=document.getElementById('transferTitle');
const text=document.getElementById('transferText');
const progress=document.getElementById('progress');
const spinner=document.getElementById('spinner');
const done=document.getElementById('doneBtn');
const tr=(key,de)=>window.WWGI18N?WWGI18N.t(key,de):de;
let stage=0;
function renderStage(){
  if(stage===1){title.textContent=tr('emergency.transfer.title1','Anfrage wird eingereicht');text.textContent=tr('emergency.transfer.text1','Übertragung an die zuständige weihnachtliche Stelle wird vorbereitet.');}
  if(stage===2){text.textContent=tr('emergency.transfer.text2','Meldedaten werden gesichert übertragen und der Lagebewertung zugeführt.');}
  if(stage===3){title.textContent=tr('emergency.transfer.title3','Notstandsübertragung abgeschlossen');text.textContent=tr('emergency.transfer.text3','Die Meldung wurde der zuständigen Stelle übermittelt.');}
  if(stage===4){title.textContent=tr('emergency.transfer.title4','Der Weihnachtsmann wurde informiert.');text.textContent=tr('emergency.transfer.text4','Die Notstandsmeldung wurde zur Kenntnisnahme an die oberste weihnachtliche Stelle weitergeleitet.');}
}
window.addEventListener('wwg-languagechange',()=>{if(stage)renderStage();});
form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.reportValidity()) return;
  transfer.classList.add('show');transfer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  done.classList.add('hidden');spinner.classList.remove('done');progress.style.width='0%';
  stage=1;renderStage();
  requestAnimationFrame(()=>{progress.style.width='24%';});
  // Deliberately leisurely transmission timings: the ZeDiWAu server infrastructure is not renowned for haste.
  setTimeout(()=>{stage=2;renderStage();progress.style.width='61%';},6000);
  setTimeout(()=>{stage=3;renderStage();progress.style.width='100%';spinner.classList.add('done');},12500);
  setTimeout(()=>{stage=4;renderStage();done.classList.remove('hidden');},18500);
});
done.addEventListener('click',()=>location.href='/');
