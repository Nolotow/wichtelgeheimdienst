const form=document.getElementById('emergencyForm');
const transfer=document.getElementById('transfer');
const title=document.getElementById('transferTitle');
const text=document.getElementById('transferText');
const progress=document.getElementById('progress');
const spinner=document.getElementById('spinner');
const done=document.getElementById('doneBtn');
form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.reportValidity()) return;
  transfer.classList.add('show');transfer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  title.textContent='Anfrage wird eingereicht';text.textContent='Übertragung an die zuständige weihnachtliche Stelle wird vorbereitet.';progress.style.width='28%';
  setTimeout(()=>{progress.style.width='72%';text.textContent='Meldedaten werden gesichert übertragen und der Lagebewertung zugeführt.';},1300);
  setTimeout(()=>{progress.style.width='100%';spinner.classList.add('done');title.textContent='Notstandsübertragung abgeschlossen';text.textContent='Die Meldung wurde der zuständigen Stelle übermittelt.';},2800);
  setTimeout(()=>{title.textContent='Der Weihnachtsmann wurde informiert.';text.textContent='Die Notstandsmeldung wurde zur Kenntnisnahme an die oberste weihnachtliche Stelle weitergeleitet.';done.classList.remove('hidden');},4300);
});
done.addEventListener('click',()=>location.href='/');
