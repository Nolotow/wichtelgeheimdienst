(() => {
  const API=String(window.WWG_BACKEND_URL||'').replace(/\/$/,'');
  const E=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const params=new URLSearchParams(location.search),pathMatch=location.pathname.match(/(WWG-[A-Z]{3}-\d{4}-\d{3})/i);
  const caseId=String(params.get('case')||pathMatch?.[1]||'').toUpperCase();
  const storageKey='wwg_case_session_'+caseId;
  let token=localStorage.getItem(storageKey)||'',lang='de';
  const TXT={
    de:{title:'WWG – Wichtelakte',unit:'Zentrale Dienststelle Weihnachtliche Aufklärung (ZeDiWAu)',classification:'VERSCHLUSSSACHE',caseLabel:'Aktenzeichen',categoryLabel:'Kategorie',category:'Individuelle Weihnachtszuteilung',stateLabel:'Status',protocol:'ZUGRIFFSPROTOKOLL',password:'Persönliches Aktenkennwort',login:'IDENTITÄT BESTÄTIGEN',pending:'Authentifizierung erforderlich',checking:'Berechtigung wird geprüft …',bad:'Aktenzeichen oder Kennwort unzutreffend.',limited:'Zu viele Fehlversuche. Der Zugang ist vorübergehend gesperrt.',unknown:'Akte konnte nicht bestimmt werden.',ready:'Identität bestätigt. Akte kann entsiegelt werden.',tap:'AKTE ENTSIEGELN',decrypt:'Weihnachtsakte wird entschlüsselt …',done:'Zuteilung erfolgreich entschlüsselt.',open:'Zugriff freigegeben',stamp:'FREIGABE\nBESTÄTIGT',decisionLabel:'ZUGRIFFSENTSCHEIDUNG',decision:'Der Zugriff auf die vorliegende Wichtelakte wurde freigegeben.',assignmentKicker:'WEIHNACHTLICHE ZUTEILUNG BESTÄTIGT',assignmentLabel:'Die der vorliegenden Akte zugeteilte Zielperson lautet',seal:'Identität ausschließlich für die berechtigte Person freigegeben.',footer:'WWG · ZeDiWAu · Aufruf unterliegt der weihnachtlichen Geheimhaltung.',logout:'Gerätezugang aufheben',back:'Zur Zentralen Dienststelle',none:'Keine Zielperson ist derzeit zugeteilt.'},
    pt:{title:'WWG – Processo do duende',unit:'Serviço Central de Inteligência Natalícia (ZeDiWAu)',classification:'DOCUMENTO CLASSIFICADO',caseLabel:'Número do processo',categoryLabel:'Categoria',category:'Atribuição natalícia individual',stateLabel:'Estado',protocol:'PROTOCOLO DE ACESSO',password:'Senha pessoal do processo',login:'CONFIRMAR IDENTIDADE',pending:'Autenticação necessária',checking:'Verificando autorização …',bad:'Número do processo ou senha incorretos.',limited:'Muitas tentativas incorretas. O acesso está temporariamente bloqueado.',unknown:'Não foi possível identificar o processo.',ready:'Identidade confirmada. O processo pode ser aberto.',tap:'ABRIR PROCESSO',decrypt:'Descriptografando o processo natalício …',done:'Atribuição descriptografada com sucesso.',open:'Acesso autorizado',stamp:'AUTORIZAÇÃO\nCONFIRMADA',decisionLabel:'DECISÃO DE ACESSO',decision:'O acesso ao presente processo do duende foi autorizado.',assignmentKicker:'ATRIBUIÇÃO NATALÍCIA CONFIRMADA',assignmentLabel:'A pessoa destinatária atribuída ao presente processo é',seal:'Identidade divulgada exclusivamente à pessoa autorizada.',footer:'WWG · ZeDiWAu · O acesso está sujeito ao sigilo natalício.',logout:'Revogar acesso deste dispositivo',back:'Voltar ao Serviço Central',none:'Nenhuma pessoa destinatária está atualmente atribuída.'},
    en:{title:'WWG – Elf file',unit:'Central Office for Christmas Intelligence (ZeDiWAu)',classification:'CLASSIFIED FILE',caseLabel:'Case reference',categoryLabel:'Category',category:'Individual Christmas allocation',stateLabel:'Status',protocol:'ACCESS PROTOCOL',password:'Personal file password',login:'CONFIRM IDENTITY',pending:'Authentication required',checking:'Verifying authorisation …',bad:'Case reference or password is incorrect.',limited:'Too many incorrect attempts. Access is temporarily blocked.',unknown:'The file could not be identified.',ready:'Identity confirmed. The file may be unsealed.',tap:'UNSEAL FILE',decrypt:'Decrypting Christmas file …',done:'Allocation successfully decrypted.',open:'Access authorised',stamp:'AUTHORISATION\nCONFIRMED',decisionLabel:'ACCESS DECISION',decision:'Access to this elf file has been authorised.',assignmentKicker:'CHRISTMAS ALLOCATION CONFIRMED',assignmentLabel:'The target person allocated to this file is',seal:'Identity released solely to the authorised person.',footer:'WWG · ZeDiWAu · Access is subject to Christmas secrecy.',logout:'Revoke device access',back:'Back to the Central Office',none:'No target person is currently allocated.'}
  };
  const t=()=>TXT[lang]||TXT.de;
  function applyLanguage(){
    const s=t();document.documentElement.lang=lang;document.title=s.title;
    const values={unitText:s.unit,classTitle:s.classification,caseLabel:s.caseLabel,categoryLabel:s.categoryLabel,categoryValue:s.category,stateLabel:s.stateLabel,protocolLabel:s.protocol,passwordLabel:s.password,loginBtn:s.login,tapBtn:s.tap,stamp:s.stamp,decisionLabel:s.decisionLabel,decisionText:s.decision,assignmentKicker:s.assignmentKicker,assignmentLabel:s.assignmentLabel,sealNote:s.seal,footerText:s.footer,logoutBtn:s.logout,backLink:s.back};
    for(const [id,value] of Object.entries(values)){const el=E(id);if(el)el.textContent=value}
  }
  function headers(){return token?{Authorization:'Bearer '+token}:{}}
  async function api(path,opts={}){const r=await fetch(API+path,{cache:'no-store',...opts,headers:{...headers(),...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.error||t().bad);e.status=r.status;throw e}return d}
  async function loadPublicLanguage(){
    if(!/^WWG-[A-Z]{3}-\d{4}-\d{3}$/.test(caseId)||!API)return false;
    try{const d=await api('/case/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId})});if(['de','pt','en'].includes(d.language))lang=d.language;applyLanguage();return true}catch{return false}
  }
  function showLogin(message=''){applyLanguage();E('caseLoginForm').hidden=false;E('tapBtn').hidden=true;E('logoutBtn').hidden=true;E('status').textContent=t().pending;E('fileState').textContent=t().pending;E('loginResult').textContent=message;E('progress').style.width='10%'}
  async function establish(){
    E('caseId').textContent=caseId||'–';
    if(!(await loadPublicLanguage())){showLogin(t().unknown);return}
    if(!token){showLogin();return}
    try{const s=await api('/case/session');if(s.caseId!==caseId)throw new Error();lang=s.language||lang;applyLanguage();E('caseLoginForm').hidden=true;E('logoutBtn').hidden=false;E('status').textContent=t().ready;E('fileState').textContent=t().ready;E('tapBtn').hidden=false;E('progress').style.width='25%'}
    catch{localStorage.removeItem(storageKey);token='';showLogin()}
  }
  E('caseLoginForm').addEventListener('submit',async e=>{
    e.preventDefault();E('loginResult').textContent='';E('loginBtn').disabled=true;E('status').textContent=t().checking;E('progress').style.width='45%';
    try{const d=await api('/case/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId,password:E('casePassword').value})});token=d.token;localStorage.setItem(storageKey,token);E('casePassword').value='';await establish()}
    catch(err){showLogin(err.status===429?t().limited:t().bad)}finally{E('loginBtn').disabled=false}
  });
  E('tapBtn').addEventListener('click',async()=>{
    E('tapBtn').hidden=true;E('status').textContent=t().checking;E('progress').style.width='45%';await sleep(450);
    try{const data=await api('/case/current?caseId='+encodeURIComponent(caseId));lang=data.language||lang;applyLanguage();E('status').textContent=t().decrypt;E('progress').style.width='75%';await sleep(650);E('name').textContent=data.targetName||t().none;E('authorization').hidden=false;E('reveal').hidden=false;E('status').textContent=t().done;E('fileState').textContent=t().open;E('progress').style.width='100%';window.WWG_TRACK?.('reveal');E('reveal').scrollIntoView({behavior:'smooth',block:'center'})}
    catch(err){if(err.status===401){localStorage.removeItem(storageKey);token='';showLogin()}else{E('status').textContent=t().bad}}
  });
  E('logoutBtn').addEventListener('click',async()=>{try{await api('/case/logout',{method:'POST'})}catch{}localStorage.removeItem(storageKey);token='';E('authorization').hidden=true;E('reveal').hidden=true;showLogin()});
  establish();
})();
