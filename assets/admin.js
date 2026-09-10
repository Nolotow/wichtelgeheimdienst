(() => {
  const API = String(window.WWG_BACKEND_URL || '').replace(/\/$/, '');
  const token = sessionStorage.getItem('wwg_admin_token');
  const gate = document.getElementById('authGate');
  const dash = document.getElementById('dashboard');
  let DATA = null;
  let selectedDrawYear = null;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function deny(){ dash.classList.add('hidden'); gate.classList.remove('hidden'); }
  function authHeaders(extra={}){ return {Authorization:'Bearer '+token,...extra}; }
  async function api(path, opts={}){
    const res=await fetch(API+path,{...opts,headers:{...authHeaders(),...(opts.headers||{})}});
    if(res.status===401||res.status===403){sessionStorage.removeItem('wwg_admin_token');deny();throw new Error('Sitzung abgelaufen.');}
    const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error||'Abruf fehlgeschlagen.'); return data;
  }
  function fmt(ts){if(!ts)return '–';const d=new Date(ts);return isNaN(d)?ts:d.toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'});}
  function currentBerlinYear(){return Number(new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',year:'numeric'}).format(new Date()));}
  function nextDrawYear(){
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
    const y=Number(parts.year);const after=Number(parts.month)>9||(Number(parts.month)===9&&(Number(parts.day)>1||(Number(parts.day)===1&&Number(parts.hour)>=19)));return after?y+1:y;
  }
  function personById(id){return DATA?.people?.find(p=>p.id===id);}
  function caseForOwner(id){return DATA?.cases?.find(c=>c.owner_id===id);}

  async function load(){
    if(!token||!API||API.includes('DEIN-WWG-WORKER')) return deny();
    try{
      DATA=await api('/admin/dashboard');
      gate.classList.add('hidden');dash.classList.remove('hidden');
      selectedDrawYear=nextDrawYear();
      render();
      $('#updated').textContent='Lagebild aktualisiert: '+new Date().toLocaleString('de-DE');
    }catch(e){deny();}
  }

  function render(){
    const active=DATA.people.filter(p=>Number(p.active)===1);
    const unmapped=DATA.cases.filter(c=>!c.owner_id);
    $('#activeCount').textContent=active.length;
    $('#caseCount').textContent=DATA.cases.length;
    $('#unmappedCount').textContent=unmapped.length;
    $('#nextDrawShort').textContent=`01.09.${selectedDrawYear}`;
    $('#nextDrawLong').textContent=`01.09.${selectedDrawYear} · 19:00 Uhr`;
    $('#drawActive').textContent=active.length;
    $('#drawLocks').textContent=DATA.assignments.filter(a=>Number(a.year)===selectedDrawYear-1).length;
    $('#drawExclusions').textContent=DATA.exclusions.length;
    renderLegacy(unmapped);
    renderPeople();
    renderExclusions();
    renderStats();
    renderDraw();
  }

  function renderLegacy(unmapped){
    $('#legacyBadge').textContent=unmapped.length;
    const host=$('#legacyList');host.innerHTML='';
    if(!unmapped.length){host.innerHTML='<div class="process-empty">Alle Bestandsakten sind einem Inhaber zugeordnet.</div>';return;}
    const available=DATA.people.filter(p=>!caseForOwner(p.id));
    unmapped.forEach(c=>{
      const row=document.createElement('div');row.className='legacy-row';
      row.innerHTML=`<div><div class="case-id">${esc(c.case_id)}</div><div class="legacy-target">derzeitige Zielperson: ${esc(c.target_name||c.legacy_target_name||'–')}</div></div><div class="legacy-actions"><select aria-label="Inhaber auswählen"><option value="">Inhaber auswählen …</option>${available.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select><button class="ghost compact" type="button">Zuordnen</button></div>`;
      row.querySelector('button').addEventListener('click',async()=>{const owner=row.querySelector('select').value;if(!owner)return;try{await api('/admin/legacy/map',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:c.case_id,ownerId:owner})});await load();}catch(e){alert(e.message)}});
      host.appendChild(row);
    });
  }

  function renderPeople(){
    const host=$('#peopleList');host.innerHTML='';
    DATA.people.forEach(p=>{
      const c=caseForOwner(p.id);const card=document.createElement('article');card.className='person-card';
      card.innerHTML=`<div class="person-head"><div><h3>${esc(p.name)}</h3><div class="person-case">${esc(c?.case_id||'NOCH KEINE AKTE ZUGEORDNET')}</div></div><span class="state ${p.active?'':'paused'}">${p.active?'AKTIV':'PAUSIERT'}</span></div><div class="person-meta">Aktensprache: ${p.language==='pt'?'Português':p.language==='en'?'English':'Deutsch'}${c?` · <a href="${esc(c.route_path)}" target="_blank" rel="noopener" style="color:#aaa">Akte öffnen</a>`:''}</div><div class="person-target">Aktuelle Zielperson: <strong>${esc(c?.target_name||'noch nicht zugeteilt')}</strong></div><div class="person-actions"><button class="ghost" data-toggle type="button">${p.active?'Teilnahme pausieren':'Teilnahme aktivieren'}</button></div>`;
      card.querySelector('[data-toggle]').addEventListener('click',async()=>{try{await api('/admin/people/'+encodeURIComponent(p.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!Number(p.active)})});await load();}catch(e){alert(e.message)}});
      host.appendChild(card);
    });
  }

  function renderExclusions(){
    const fill=(el)=>{el.innerHTML='<option value="">Person auswählen …</option>'+DATA.people.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')};fill($('#exA'));fill($('#exB'));
    const host=$('#exclusionList');host.innerHTML='';
    if(!DATA.exclusions.length){host.innerHTML='<div class="process-empty">Keine manuellen Ausschlüsse festgelegt.</div>';return;}
    DATA.exclusions.forEach(x=>{const row=document.createElement('div');row.className='exclusion-row';row.innerHTML=`<span>${esc(x.name_a)} ↔ ${esc(x.name_b)}</span><button title="Ausschluss entfernen" type="button">×</button>`;row.querySelector('button').addEventListener('click',async()=>{try{await api(`/admin/exclusions?a=${encodeURIComponent(x.person_a)}&b=${encodeURIComponent(x.person_b)}`,{method:'DELETE'});await load();}catch(e){alert(e.message)}});host.appendChild(row)});
  }

  function statStatus(s){if(Number(s?.reveals)>0)return'FREIGEGEBEN';if(Number(s?.unlocks)>0)return'ENTSIEGELT';if(Number(s?.views)>0)return'ABGERUFEN';return'NICHT ABGERUFEN';}
  function renderStats(){
    const host=$('#statsCards');host.innerHTML='';
    DATA.cases.forEach(c=>{const s=DATA.stats[c.case_id]||{};const card=document.createElement('div');card.className='stat-card';card.innerHTML=`<div class="stat-top"><span class="stat-case">${esc(c.case_id)}</span><span class="stat-status">${statStatus(s)}</span></div><div class="stat-grid"><div><span>Aufrufe</span><b>${Number(s.views||0)}</b></div><div><span>Entsiegelt</span><b>${Number(s.unlocks||0)}</b></div><div><span>Freigegeben</span><b>${Number(s.reveals||0)}</b></div></div>`;host.appendChild(card)});
  }

  function renderDraw(){
    const draw=DATA.draws.find(d=>Number(d.year)===selectedDrawYear) || DATA.draws.find(d=>d.status==='completed');
    const process=$('#processList'),empty=$('#processEmpty'),final=$('#processFinal'),sealed=$('#sealedArea');process.innerHTML='';final.classList.add('hidden');sealed.classList.add('hidden');
    if(!draw){empty.classList.remove('hidden');return;}
    empty.classList.add('hidden');
    const steps=draw.steps||[];
    steps.forEach((s,i)=>{const li=document.createElement('li');li.innerHTML=`${esc(s.label)}<time>${fmt(s.at)}</time>`;process.appendChild(li);setTimeout(()=>li.classList.add('show'),80+i*220)});
    if(draw.status==='completed'){
      setTimeout(()=>{final.classList.remove('hidden');final.innerHTML=`<strong>Zuteilungsverfahren abgeschlossen</strong><br>${Number(draw.participant_count||0)} Wichtel berücksichtigt · ${Number(draw.assignment_count||0)} Zielpersonen zugewiesen · ${Number(draw.conflict_count||0)} Regelkonflikte`;},100+steps.length*220);
      sealed.classList.remove('hidden');$('#sealedTitle').textContent=`Zuteilung ${draw.year} · FESTGESCHRIEBEN`;$('#revokeBtn').dataset.year=draw.year;
    } else if(draw.status==='failed') {final.classList.remove('hidden');final.innerHTML=`<strong>Verfahren abgebrochen</strong><br>${esc(draw.error||'Unbestimmter Fehler')}`;}
  }

  $('#addPersonForm').addEventListener('submit',async e=>{
    e.preventDefault();const out=$('#addResult');out.className='result-line';out.textContent='Akte wird angelegt …';
    try{const r=await api('/admin/people',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('#newName').value,caseId:$('#newCase').value,language:$('#newLanguage').value,active:$('#newActive').checked})});out.textContent=`Akte ${r.caseId} wurde angelegt.`;e.target.reset();$('#newActive').checked=true;await load();}
    catch(err){out.className='result-line error';out.textContent=err.message;}
  });
  $('#exclusionForm').addEventListener('submit',async e=>{e.preventDefault();const a=$('#exA').value,b=$('#exB').value,out=$('#exResult');if(!a||!b||a===b){out.className='result-line error';out.textContent='Bitte zwei verschiedene Personen auswählen.';return;}try{await api('/admin/exclusions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({a,b})});out.className='result-line';out.textContent='Ausschluss gespeichert.';await load();}catch(err){out.className='result-line error';out.textContent=err.message}});
  $('#previewBtn').addEventListener('click',async()=>{const out=$('#previewResult');out.className='result-line';out.textContent='Vorprüfung läuft …';try{const r=await api('/admin/draw/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year:selectedDrawYear})});out.className='result-line'+(r.ok?'':' error');out.textContent=r.ok?`${r.message} ${r.participants} aktive Wichtel, ${r.previousLocks} Vorjahressperren, ${r.exclusions} manuelle Ausschlüsse.`:(r.error||r.message);}catch(e){out.className='result-line error';out.textContent=e.message}});
  $('#runBtn').addEventListener('click',async()=>{if(!confirm(`Zuteilungsverfahren ${selectedDrawYear} jetzt außerhalb des automatischen Stichtags durchführen?\n\nEine erfolgreiche Zuteilung wird festgeschrieben.`))return;const out=$('#previewResult');out.className='result-line';out.textContent='Zuteilungsverfahren wird durchgeführt …';try{await api('/admin/draw/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year:selectedDrawYear})});await load();}catch(e){out.className='result-line error';out.textContent=e.message}});
  $('#revokeBtn').addEventListener('click',()=>{const year=$('#revokeBtn').dataset.year;$('#revokeModal').dataset.year=year;$('#revokeReason').value='';$('#revokeResult').textContent='';$('#revokeModal').classList.remove('hidden');$('#revokeModal').setAttribute('aria-hidden','false');setTimeout(()=>$('#revokeReason').focus(),50)});
  $('#cancelRevoke').addEventListener('click',()=>{$('#revokeModal').classList.add('hidden');$('#revokeModal').setAttribute('aria-hidden','true')});
  $('#confirmRevoke').addEventListener('click',async()=>{const reason=$('#revokeReason').value.trim(),out=$('#revokeResult');if(!reason){out.className='result-line error';out.textContent='Eine Begründung ist für die Bestätigung erforderlich.';return;}const year=Number($('#revokeModal').dataset.year);out.className='result-line';out.textContent='Aufhebung wird durchgeführt …';try{
      // Absichtlich nur das Jahr senden. Die Begründung verlässt das Gerät nicht.
      await api('/admin/draw/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year})});
      $('#revokeReason').value='';$('#revokeModal').classList.add('hidden');$('#revokeModal').setAttribute('aria-hidden','true');await load();
    }catch(e){out.className='result-line error';out.textContent=e.message}});
  $('#refreshBtn').addEventListener('click',load);
  $('#logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('wwg_admin_token');location.href='/';});
  load();
})();
