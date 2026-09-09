(()=>{
  const releases = window.WWGPRESS_RELEASES || [];
  const lang = () => (window.WWGI18N && WWGI18N.getLang ? WWGI18N.getLang() : (localStorage.getItem('wwgLanguage')||'de'));
  const L = {
    de:{agency:'Weihnachtswichtelgeheimdienst · Presse- und Informationsstelle',title:'Presse',lead:'Pressemitteilungen des Weihnachtswichtelgeheimdienstes. Veröffentlichungen erfolgen nach Maßgabe der geltenden weihnachtlichen Geheimhaltungs- und Informationsvorschriften.',search:'Pressemitteilungen durchsuchen',searchph:'Suchbegriff eingeben',year:'Jahr',all:'Alle Jahre',type:'Pressemitteilung',count:n=>`${n} Pressemitteilung${n===1?'':'en'}`,empty:'Keine Pressemitteilungen entsprechen den gewählten Kriterien.',archive:'Pressemitteilungen',backArchive:'← Zur Presseübersicht',backCentral:'← Zur Zentralen Dienststelle'},
    en:{agency:'Weihnachtswichtelgeheimdienst · Press and Information Office',title:'Press',lead:'Press releases issued by the Weihnachtswichtelgeheimdienst. Publication is subject to the applicable Christmas secrecy and information provisions.',search:'Search press releases',searchph:'Enter search term',year:'Year',all:'All years',type:'Press release',count:n=>`${n} press release${n===1?'':'s'}`,empty:'No press releases match the selected criteria.',archive:'Press releases',backArchive:'← Back to Press',backCentral:'← Back to the Central Office'}
  };
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function t(){return L[lang()==='en'?'en':'de']}
  function setCommon(){
    const x=t();
    document.querySelectorAll('[data-press-agency]').forEach(e=>e.textContent=x.agency);
    document.querySelectorAll('[data-press-back-central]').forEach(e=>e.textContent=x.backCentral);
    document.documentElement.lang=lang()==='en'?'en':'de';
  }
  function renderIndex(){
    const root=document.getElementById('pressIndex'); if(!root) return;
    const x=t();
    document.title=(lang()==='en'?'Press':'Presse')+' · WWG';
    root.querySelector('[data-press-title]').textContent=x.title;
    root.querySelector('[data-press-lead]').textContent=x.lead;
    root.querySelector('[data-search-label]').textContent=x.search;
    root.querySelector('#pressSearch').placeholder=x.searchph;
    root.querySelector('[data-year-label]').textContent=x.year;
    const sel=root.querySelector('#pressYear');
    const current=sel.value;
    sel.innerHTML=`<option value="">${esc(x.all)}</option>`+[...new Set(releases.map(r=>r.iso.slice(0,4)))].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');
    sel.value=current;
    filterIndex();
  }
  function filterIndex(){
    const root=document.getElementById('pressIndex'); if(!root) return;
    const q=root.querySelector('#pressSearch').value.trim().toLowerCase();
    const year=root.querySelector('#pressYear').value;
    const isEn=lang()==='en'; const x=t();
    const filtered=releases.filter(r=>{
      const title=(isEn?r.en_title:r.de_title).toLowerCase();
      const body=(isEn?r.en:r.de).map(v=>typeof v==='string'?v:v.quote||'').join(' ').toLowerCase();
      return (!year||r.iso.startsWith(year)) && (!q||title.includes(q)||body.includes(q)||r.number.includes(q));
    });
    root.querySelector('#pressCount').textContent=x.count(filtered.length);
    const list=root.querySelector('#pressList');
    list.innerHTML=filtered.map(r=>`<a class="press-item" href="/presse/${r.id}/"><div class="press-meta"><strong>${esc(isEn?r.date_en:r.date_de)}</strong>${esc(x.type)}<br>PM ${esc(r.number)}</div><h2 class="press-title">${esc(isEn?r.en_title:r.de_title)}</h2></a>`).join('');
    root.querySelector('#pressEmpty').hidden=filtered.length!==0;
    root.querySelector('#pressEmpty').textContent=x.empty;
  }
  function renderDetail(){
    const root=document.getElementById('pressRelease'); if(!root) return;
    const id=root.dataset.release;
    const r=releases.find(v=>v.id===id); if(!r) return;
    const isEn=lang()==='en', x=t();
    document.title=(isEn?r.en_title:r.de_title)+' · WWG';
    root.querySelector('[data-release-type]').textContent=`${x.type} · PM ${r.number}`;
    root.querySelector('[data-release-date]').textContent=isEn?r.date_en:r.date_de;
    root.querySelector('[data-release-title]').textContent=isEn?r.en_title:r.de_title;
    const body=isEn?r.en:r.de;
    root.querySelector('[data-release-body]').innerHTML=body.map(v=>typeof v==='string'?`<p>${esc(v)}</p>`:`<blockquote>${esc(v.quote)}</blockquote>`).join('');
    root.querySelector('[data-back-archive]').textContent=x.backArchive;
  }
  function renderAll(){setCommon();renderIndex();renderDetail()}
  document.addEventListener('DOMContentLoaded',()=>{
    renderAll();
    const s=document.getElementById('pressSearch'), y=document.getElementById('pressYear');
    if(s)s.addEventListener('input',filterIndex); if(y)y.addEventListener('change',filterIndex);
  });
  window.addEventListener('wwg-languagechange',renderAll);
})();
