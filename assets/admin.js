(() => {
  const API = String(window.WWG_BACKEND_URL || '').replace(/\/$/, '');
  const token = sessionStorage.getItem('wwg_admin_token');
  const gate = document.getElementById('authGate');
  const dash = document.getElementById('dashboard');

  function deny(){ dash.classList.add('hidden'); gate.classList.remove('hidden'); }
  function fmt(ts){ if(!ts) return '–'; const d=new Date(ts.endsWith('Z')?ts:ts+'Z'); return isNaN(d)?ts:d.toLocaleString('de-DE'); }
  function sourceCell(r){
    const parts=[];
    if(r.manual_views) parts.push(`Eingabe ${r.manual_views}`);
    if(r.qr_views) parts.push(`QR ${r.qr_views}`);
    if(r.direct_views) parts.push(`Direkt ${r.direct_views}`);
    return parts.join(' · ') || '–';
  }
  function deviceCell(r){
    const parts=[];
    if(r.mobile_views) parts.push(`Mobil ${r.mobile_views}`);
    if(r.tablet_views) parts.push(`Tablet ${r.tablet_views}`);
    if(r.desktop_views) parts.push(`Desktop ${r.desktop_views}`);
    return parts.join(' · ') || '–';
  }
  function status(r){ if(r.reveals>0) return 'FREIGEGEBEN'; if(r.unlocks>0) return 'ENTSIEGELT'; if(r.views>0) return 'ABGERUFEN'; return 'NICHT ABGERUFEN'; }

  async function load(){
    if(!token || !API || API.includes('DEIN-WWG-WORKER')) return deny();
    try{
      const res=await fetch(API+'/admin/stats',{headers:{Authorization:'Bearer '+token}});
      if(res.status===401||res.status===403){ sessionStorage.removeItem('wwg_admin_token'); return deny(); }
      if(!res.ok) throw new Error('Abruf fehlgeschlagen');
      const data=await res.json();
      gate.classList.add('hidden'); dash.classList.remove('hidden');
      const rows=data.cases||[];
      document.getElementById('totalViews').textContent=rows.reduce((a,r)=>a+Number(r.views||0),0);
      document.getElementById('totalUnlocks').textContent=rows.reduce((a,r)=>a+Number(r.unlocks||0),0);
      document.getElementById('totalReveals').textContent=rows.reduce((a,r)=>a+Number(r.reveals||0),0);
      document.getElementById('untouched').textContent=rows.filter(r=>!Number(r.views||0)).length;
      const body=document.getElementById('statsBody'); body.innerHTML='';
      rows.forEach(r=>{
        const tr=document.createElement('tr');
        const vals=[r.case_id,r.display_name,status(r),r.views,r.unlocks,r.reveals,sourceCell(r),deviceCell(r),fmt(r.first_seen),fmt(r.last_seen)];
        vals.forEach((v,i)=>{ const td=document.createElement('td'); td.textContent=v??'–'; if(i===0) td.className='case'; if(i===2){const s=document.createElement('span'); s.className='status'; s.textContent=v; td.textContent=''; td.appendChild(s)} tr.appendChild(td); });
        body.appendChild(tr);
      });
      const alerts=document.getElementById('alerts'); alerts.innerHTML='';
      const items=[];
      rows.filter(r=>!Number(r.views||0)).forEach(r=>items.push(`${r.case_id} (${r.display_name}) wurde noch nie abgerufen.`));
      rows.filter(r=>Number(r.views||0)>=10).forEach(r=>items.push(`${r.case_id} (${r.display_name}) weist ungewöhnlich viele Aufrufe auf: ${r.views}.`));
      rows.filter(r=>Number(r.views||0)>0&&!Number(r.reveals||0)).forEach(r=>items.push(`${r.case_id} (${r.display_name}) wurde aufgerufen, die Zielperson aber noch nicht freigegeben.`));
      if(!items.length){ const p=document.createElement('div');p.className='ok';p.textContent='Keine besonderen Vorkommnisse.';alerts.appendChild(p); }
      else items.forEach(x=>{const d=document.createElement('div');d.className='alert';d.textContent=x;alerts.appendChild(d)});
      document.getElementById('updated').textContent='Lagebild aktualisiert: '+new Date().toLocaleString('de-DE');
    }catch(e){ deny(); }
  }
  document.getElementById('refreshBtn').addEventListener('click',load);
  document.getElementById('logoutBtn').addEventListener('click',()=>{sessionStorage.removeItem('wwg_admin_token');location.href='/';});
  load();
})();
