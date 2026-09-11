(() => {
  const API = String(window.WWG_BACKEND_URL || '').replace(/\/$/, '');
  const token = sessionStorage.getItem('wwg_admin_token');
  const gate = document.getElementById('authGate');
  const dash = document.getElementById('dashboard');
  let DATA = null;
  let selectedDrawYear = null;
  let revealPersonId = null;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function deny(){ dash.classList.add('hidden'); gate.classList.remove('hidden'); }
  function authHeaders(extra={}){ return {Authorization:'Bearer '+token,...extra}; }
  async function api(path, opts={}){
    const res=await fetch(API+path,{...opts,headers:{...authHeaders(),...(opts.headers||{})}});
    if(res.status===401||res.status===403){sessionStorage.removeItem('wwg_admin_token');deny();throw new Error('Sitzung abgelaufen.');}
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||'Abruf fehlgeschlagen.');
    return data;
  }
  function fmt(ts){if(!ts)return '–';const d=new Date(ts);return isNaN(d)?ts:d.toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'});}
  function berlinParts(){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));}
  function baseNextDrawYear(){const p=berlinParts();const y=Number(p.year);const after=Number(p.month)>9||(Number(p.month)===9&&(Number(p.day)>1||(Number(p.day)===1&&Number(p.hour)>=19)));return after?y+1:y;}
  function completedDraw(year){return DATA?.draws?.find(d=>Number(d.year)===Number(year)&&d.status==='completed');}
  function nextOperationalDrawYear(){let y=baseNextDrawYear();while(completedDraw(y))y++;return y;}
  function regularDrawPassed(year){const p=berlinParts();const y=Number(p.year),m=Number(p.month),d=Number(p.day),h=Number(p.hour);if(y>year)return true;if(y<year)return false;if(m>9)return true;if(m<9)return false;if(d>1)return true;if(d<1)return false;return h>=19;}
  function isEarly(year){return !regularDrawPassed(year);}
  function caseForOwner(id){return DATA?.cases?.find(c=>c.owner_id===id);}
  function assignmentCount(year){return Number(DATA?.assignmentCounts?.[String(year)]||0);}
  function suggestedPassword(){const words=['Tanne','Nordlicht','Stern','Schlitten','Mistel','Zimt','Flocke','Paket','Laterne','Kakao'];const a=crypto.getRandomValues(new Uint32Array(3));return `${words[a[0]%words.length]}-${words[a[1]%words.length]}-${1000+a[2]%9000}`;}

  async function load(){
    if(!token||!API||API.includes('DEIN-WWG-WORKER')) return deny();
    try{
      DATA=await api('/admin/dashboard');
      gate.classList.add('hidden');dash.classList.remove('hidden');
      selectedDrawYear=nextOperationalDrawYear();
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
    $('#drawLocks').textContent=assignmentCount(selectedDrawYear-1);
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
      row.innerHTML=`<div><div class="case-id">${esc(c.case_id)}</div><div class="legacy-target">derzeitige Zielperson: ${esc(c.migration_target_name||c.legacy_target_name||'–')}</div></div><div class="legacy-actions"><select aria-label="Inhaber auswählen"><option value="">Inhaber auswählen …</option>${available.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select><button class="ghost compact" type="button">Zuordnen</button></div>`;
      row.querySelector('button').addEventListener('click',async()=>{const owner=row.querySelector('select').value;if(!owner)return;try{await api('/admin/legacy/map',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:c.case_id,ownerId:owner})});await load();}catch(e){alert(e.message)}});
      host.appendChild(row);
    });
  }

  function renderPeople(){
    const host=$('#peopleList');host.innerHTML='';
    DATA.people.forEach(p=>{
      const c=caseForOwner(p.id);if(c?.preferred_language)p.language=c.preferred_language;const hasTarget=Boolean(Number(c?.has_target));const card=document.createElement('article');card.className='person-card';
      card.innerHTML=`<div class="person-head"><div><h3>${esc(p.name)}</h3><div class="person-case">${esc(c?.case_id||'NOCH KEINE AKTE ZUGEORDNET')}</div></div><span class="state ${p.active?'':'paused'}">${p.active?'AKTIV':'PAUSIERT'}</span></div><div class="person-meta">Aktensprache: ${p.language==='pt'?'Português':p.language==='en'?'English':'Deutsch'}${c?` · <a href="${esc(c.route_path)}" target="_blank" rel="noopener" class="case-open-link">Akte öffnen</a>`:''}</div><div class="person-target sealed"><span>Zuteilungsstatus:</span> <strong>${hasTarget?'Zielperson hinterlegt':'noch nicht zugeteilt'}</strong></div>${c?`<div class="person-target sealed"><span>Aktenzugang:</span> <strong>${Number(c.has_credential)?'Kennwort gesetzt':'noch gesperrt'}</strong>${Number(c.active_sessions)?` · ${Number(c.active_sessions)} aktives Gerät`:''}</div>`:''}<div class="person-actions">${hasTarget?`<button class="ghost" data-reveal type="button">Zielperson entsiegeln</button>`:''}${c?`<button class="ghost" data-credential type="button">${Number(c.has_credential)?'Kennwort ersetzen':'Kennwort einrichten'}</button>${Number(c.active_sessions)?'<button class="ghost" data-revoke-sessions type="button">Geräte abmelden</button>':''}`:''}<button class="ghost" data-toggle type="button">${p.active?'Teilnahme pausieren':'Teilnahme aktivieren'}</button></div>`;
      card.querySelector('[data-toggle]').addEventListener('click',async()=>{try{await api('/admin/people/'+encodeURIComponent(p.id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:!Number(p.active)})});await load();}catch(e){alert(e.message)}});
      const reveal=card.querySelector('[data-reveal]');if(reveal)reveal.addEventListener('click',()=>openTargetModal(p));
      const credential=card.querySelector('[data-credential]');if(credential)credential.addEventListener('click',async()=>{const suggestion=suggestedPassword();const password=prompt('Neues persönliches Aktenkennwort (mindestens 12 Zeichen). Das Kennwort wird nur jetzt angezeigt und muss der berechtigten Person sicher mitgeteilt werden.',suggestion);if(password===null)return;if(password.length<12){alert('Das Kennwort muss mindestens 12 Zeichen lang sein.');return}try{await api(`/admin/cases/${encodeURIComponent(c.case_id)}/credential`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});alert(`Kennwort eingerichtet.\n\n${password}\n\nBitte jetzt sicher notieren oder übermitteln.`);await load()}catch(e){alert(e.message)}});
      const revokeSessions=card.querySelector('[data-revoke-sessions]');if(revokeSessions)revokeSessions.addEventListener('click',async()=>{if(!confirm(`Alle angemeldeten Geräte für ${p.name} abmelden?`))return;try{await api(`/admin/cases/${encodeURIComponent(c.case_id)}/sessions`,{method:'DELETE'});await load()}catch(e){alert(e.message)}});
      host.appendChild(card);
    });
  }

  function openTargetModal(person){
    revealPersonId=person.id;
    $('#targetModalTitle').textContent=`Zielperson für ${person.name} entsiegeln`;
    $('#sealedTargetResult').classList.add('hidden');$('#sealedTargetResult').innerHTML='';
    $('#targetRevealResult').textContent='';$('#confirmTargetReveal').classList.remove('hidden');
    $('#targetModal').classList.remove('hidden');$('#targetModal').setAttribute('aria-hidden','false');
  }
  function closeTargetModal(){revealPersonId=null;$('#targetModal').classList.add('hidden');$('#targetModal').setAttribute('aria-hidden','true');$('#sealedTargetResult').classList.add('hidden');$('#sealedTargetResult').innerHTML='';}

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

  function latestCompletedDraw(){return (DATA.draws||[]).filter(d=>d.status==='completed').sort((a,b)=>Number(b.year)-Number(a.year))[0]||null;}
  function renderDraw(){
    const draw=DATA.draws.find(d=>Number(d.year)===selectedDrawYear) || latestCompletedDraw();
    const process=$('#processList'),empty=$('#processEmpty'),final=$('#processFinal'),sealed=$('#sealedArea');process.innerHTML='';final.classList.add('hidden');sealed.classList.add('hidden');
    if(!draw){empty.classList.remove('hidden');return;}
    empty.classList.add('hidden');
    const steps=draw.steps||[];
    steps.forEach((s,i)=>{const li=document.createElement('li');li.innerHTML=`${esc(s.label)}<time>${fmt(s.at)}</time>`;process.appendChild(li);setTimeout(()=>li.classList.add('show'),80+i*180)});
    if(draw.status==='completed'){
      const early=draw.source==='manual_early';
      setTimeout(()=>{final.classList.remove('hidden');final.innerHTML=`<strong>Zuteilungsverfahren abgeschlossen</strong><br>${Number(draw.participant_count||0)} Wichtel berücksichtigt · ${Number(draw.assignment_count||0)} Zielpersonen eindeutig zugewiesen · ${Number(draw.conflict_count||0)} Regelkonflikte${early?`<div class="automation-note">Zuteilung ${draw.year} vorzeitig festgeschrieben. Der reguläre automatische Lauf am 01.09.${draw.year} ist ausgesetzt. Nächster automatischer Regellauf: 01.09.${Number(draw.year)+1} · 19:00 Uhr.</div>`:''}`;},100+steps.length*180);
      sealed.classList.remove('hidden');$('#sealedTitle').textContent=`Zuteilung ${draw.year} · FESTGESCHRIEBEN`;$('#revokeBtn').dataset.year=draw.year;
    } else if(draw.status==='failed') {final.classList.remove('hidden');final.innerHTML=`<strong>Verfahren abgebrochen</strong><br>${esc(draw.error||'Unbestimmter Fehler')}`;}
  }

  function openDrawModal(){
    const year=selectedDrawYear, early=isEarly(year);
    $('#drawStageOne').classList.remove('hidden');$('#drawStageTwo').classList.add('hidden');
    $('#drawIntroText').innerHTML=`Sie sind im Begriff, das amtliche Zuteilungsverfahren für das Wichteljahr <strong>${year}</strong> einzuleiten. Nach Freigabe werden die zum Zeitpunkt der Durchführung als aktiv geführten Personen unter Berücksichtigung der geltenden Zuteilungsausschlüsse einer Zielperson zugeordnet. Eine abgeschlossene Zuteilung wird als amtlicher Jahresstand festgeschrieben und unmittelbar in die betroffenen Wichtelakten übernommen.`;
    $('#drawFacts').innerHTML=`<div><span>Wichteljahr</span><strong>${year}</strong></div><div><span>Aktive Wichtel</span><strong>${DATA.people.filter(p=>Number(p.active)===1).length}</strong></div><div><span>Vorjahressperren</span><strong>${assignmentCount(year-1)}</strong></div><div><span>Manuelle Ausschlüsse</span><strong>${DATA.exclusions.length}</strong></div>`;
    $('#drawPhrase').value='';$('#earlyConfirm').checked=false;$('#drawConfirmResult').textContent='';
    $('#drawPhraseLabel').textContent=`Zur Bestätigung exakt „ZUTEILUNG ${year}“ eingeben`;
    $('#earlyWarning').classList.toggle('hidden',!early);
    if(early)$('#earlyWarningText').textContent=`Der reguläre Durchführungstermin für das Wichteljahr ${year} ist der 01.09.${year} um 19:00 Uhr Europe/Berlin. Eine jetzt festgeschriebene Zuteilung setzt den automatischen Lauf für ${year} aus; der Automatismus wird erst im Folgejahr wieder regulär tätig.`;
    $('#drawModal').classList.remove('hidden');$('#drawModal').setAttribute('aria-hidden','false');
  }
  function closeDrawModal(){$('#drawModal').classList.add('hidden');$('#drawModal').setAttribute('aria-hidden','true');}

  $('#addPersonForm').addEventListener('submit',async e=>{
    e.preventDefault();const out=$('#addResult');out.className='result-line';out.textContent='Akte wird angelegt …';
    try{const r=await api('/admin/people',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('#newName').value,caseId:$('#newCase').value,language:$('#newLanguage').value,active:$('#newActive').checked})});out.textContent=`Akte ${r.caseId} wurde angelegt.`;e.target.reset();$('#newActive').checked=true;await load();}
    catch(err){out.className='result-line error';out.textContent=err.message;}
  });
  $('#exclusionForm').addEventListener('submit',async e=>{e.preventDefault();const a=$('#exA').value,b=$('#exB').value,out=$('#exResult');if(!a||!b||a===b){out.className='result-line error';out.textContent='Bitte zwei verschiedene Personen auswählen.';return;}try{await api('/admin/exclusions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({a,b})});out.className='result-line';out.textContent='Ausschluss gespeichert.';await load();}catch(err){out.className='result-line error';out.textContent=err.message}});
  $('#previewBtn').addEventListener('click',async()=>{const out=$('#previewResult');out.className='result-line';out.innerHTML='Vorprüfung läuft …';try{const r=await api('/admin/draw/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year:selectedDrawYear})});out.className='result-line'+(r.ok?'':' error');out.innerHTML=r.ok?`<strong>VORPRÜFUNG ABGESCHLOSSEN – VERFAHRENSFÄHIG</strong><br>Teilnehmerbestand: ${r.participants} · Vorjahressperren: ${r.previousLocks} · Manuelle Ausschlüsse: ${r.exclusions}<br>Selbstzuteilungen ausgeschlossen: JA · Eindeutige Zielpersonen: JA · Vollständige Zuteilung mathematisch möglich: JA`:(esc(r.error||r.message));}catch(e){out.className='result-line error';out.textContent=e.message}});
  $('#runBtn').addEventListener('click',openDrawModal);
  document.querySelectorAll('[data-close-draw]').forEach(b=>b.addEventListener('click',closeDrawModal));
  $('#drawProceedBtn').addEventListener('click',()=>{$('#drawStageOne').classList.add('hidden');$('#drawStageTwo').classList.remove('hidden');setTimeout(()=>$('#drawPhrase').focus(),40)});
  $('#drawBackBtn').addEventListener('click',()=>{$('#drawStageTwo').classList.add('hidden');$('#drawStageOne').classList.remove('hidden')});
  $('#drawConfirmBtn').addEventListener('click',async()=>{const year=selectedDrawYear,out=$('#drawConfirmResult'),required=`ZUTEILUNG ${year}`,early=isEarly(year);if($('#drawPhrase').value.trim()!==required){out.className='result-line error';out.textContent=`Bestätigungsphrase stimmt nicht. Erforderlich ist: ${required}`;return;}if(early&&!$('#earlyConfirm').checked){out.className='result-line error';out.textContent='Die vorzeitige Durchführung muss ausdrücklich zugelassen werden.';return;}out.className='result-line';out.textContent='Amtliches Zuteilungsverfahren wird festgeschrieben …';$('#drawConfirmBtn').disabled=true;try{await api('/admin/draw/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year,confirmationPhrase:required,earlyConfirmed:early?true:false})});closeDrawModal();await load();}catch(e){out.className='result-line error';out.textContent=e.message;}finally{$('#drawConfirmBtn').disabled=false;}});

  $('#cancelTargetReveal').addEventListener('click',closeTargetModal);
  $('#confirmTargetReveal').addEventListener('click',async()=>{if(!revealPersonId)return;const out=$('#targetRevealResult');out.className='result-line';out.textContent='Zuteilungsdaten werden entsiegelt …';try{const r=await api('/admin/assignment/reveal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({personId:revealPersonId})});$('#sealedTargetResult').classList.remove('hidden');$('#sealedTargetResult').innerHTML=`<span>Zugewiesene Zielperson</span><strong>${esc(r.targetName||'Keine Zielperson hinterlegt')}</strong><small>${esc(r.caseId)}</small>`;$('#confirmTargetReveal').classList.add('hidden');out.textContent='';}catch(e){out.className='result-line error';out.textContent=e.message;}});

  $('#revokeBtn').addEventListener('click',()=>{const year=$('#revokeBtn').dataset.year;$('#revokeModal').dataset.year=year;$('#revokeReason').value='';$('#revokeResult').textContent='';$('#revokeModal').classList.remove('hidden');$('#revokeModal').setAttribute('aria-hidden','false');setTimeout(()=>$('#revokeReason').focus(),50)});
  $('#cancelRevoke').addEventListener('click',()=>{$('#revokeModal').classList.add('hidden');$('#revokeModal').setAttribute('aria-hidden','true')});
  $('#confirmRevoke').addEventListener('click',async()=>{const reason=$('#revokeReason').value.trim(),out=$('#revokeResult');if(!reason){out.className='result-line error';out.textContent='Eine Begründung ist für die Bestätigung erforderlich.';return;}const year=Number($('#revokeModal').dataset.year);out.className='result-line';out.textContent='Aufhebung wird durchgeführt …';try{await api('/admin/draw/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year})});$('#revokeReason').value='';$('#revokeModal').classList.add('hidden');$('#revokeModal').setAttribute('aria-hidden','true');await load();}catch(e){out.className='result-line error';out.textContent=e.message}});
  $('#refreshBtn').addEventListener('click',load);
  $('#logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('wwg_admin_token');location.href='/';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#targetModal').classList.contains('hidden'))closeTargetModal();if(!$('#drawModal').classList.contains('hidden'))closeDrawModal();}});
  load();
})();
