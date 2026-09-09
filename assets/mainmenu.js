(()=>{
  let b=document.getElementById('wwgMenuToggle');
  let m=document.getElementById('wwgMenu');
  let d=document.getElementById('wwgMenuBackdrop');
  if(!b||!m||!d) return;
  function set(open){
    m.classList.toggle('open',open);
    d.classList.toggle('open',open);
    m.setAttribute('aria-hidden',String(!open));
    b.setAttribute('aria-expanded',String(open));
    b.setAttribute('aria-label',open?'Hauptmenü schließen':'Hauptmenü öffnen');
    b.textContent=open?'×':'☰';
  }
  b.addEventListener('click',()=>set(!m.classList.contains('open')));
  d.addEventListener('click',()=>set(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
})();