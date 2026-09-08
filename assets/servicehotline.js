(()=>{
const preCall=document.getElementById('preCall'),connecting=document.getElementById('connecting'),activeCall=document.getElementById('activeCall'),contactButton=document.getElementById('contactButton'),hangupButton=document.getElementById('hangupButton'),queueNumber=document.getElementById('queueNumber'),queueMessage=document.getElementById('queueMessage'),estimatedTime=document.getElementById('estimatedTime'),holdMusic=document.getElementById('holdMusic');
let queue=187432,queueTimer=null,messageTimer=null,waitTimer=null,lastH=null,lastM=null,messageIndex=0;
let callActive=false, audioPhase='music', announcementIndex=0;

const MUSIC_SRC='/assets/audio/wwg-warteschleife.mp3';
const ANNOUNCEMENTS=[
  '/assets/audio/ansagen/01-formularhinweis.mp3',
  '/assets/audio/ansagen/02-aktenzeichen.mp3',
  '/assets/audio/ansagen/03-thine-hinweis.mp3',
  '/assets/audio/ansagen/04-wartezeit-hinweis.mp3',
  '/assets/audio/ansagen/05-geschenkangelegenheiten.mp3',
  '/assets/audio/ansagen/06-geheimhaltung.mp3',
  '/assets/audio/ansagen/07-oeffnungszeiten.mp3'
];

const messagesDe=['Alle Wichtelsachbearbeiter befinden sich derzeit im Gespräch.','Ihr Anliegen ist uns wichtig. Bitte bleiben Sie in der Leitung.','Bitte halten Sie Ihr Aktenzeichen griffbereit.','Eine Weiterleitung an den nächsten verfügbaren Wichtelsachbearbeiter erfolgt automatisch.','Von wiederholten Nachfragen zum Bearbeitungsstand bitten wir abzusehen.','Die zentrale Artigkeitsdatenbank wird derzeit planmäßig abgeglichen.','Geschenkbezogene Eilanträge können gegenwärtig nicht priorisiert werden.','Bitte haben Sie noch einen kleinen weihnachtlichen Augenblick Geduld.','Ihre Verbindung zur Zentralen Dienststelle besteht weiterhin.','Aus Qualitätsgründen kann dieses Gespräch möglicherweise von niemandem entgegengenommen werden.'];
const tr=(key,de)=>window.WWGI18N?WWGI18N.t(key,de):de;
const lang=()=>window.WWGI18N?WWGI18N.getLang():'de';
const formatNumber=v=>v.toLocaleString(lang()==='en'?'en-GB':'de-DE');
const msg=i=>tr('hotline.msg'+i,messagesDe[i]);
function newQueuePosition(){return 187432+Math.floor(Math.random()*1701)-850}
function renderEstimated(){if(lastH==null)return;estimatedTime.textContent=lang()==='en'?`${lastH} hours and ${lastM} minutes`:`${lastH} Stunden und ${lastM} Minuten`}
function setEstimatedTime(){lastH=34+Math.floor(Math.random()*15);lastM=Math.floor(Math.random()*60);renderEstimated()}
function changeQueue(){const r=Math.random();if(r<.57)queue-=1;else if(r<.84)queue-=2+Math.floor(Math.random()*2);else queue+=1+Math.floor(Math.random()*4);queueNumber.textContent=formatNumber(queue)}
function changeMessage(){let n=messageIndex;while(n===messageIndex)n=Math.floor(Math.random()*messagesDe.length);messageIndex=n;queueMessage.textContent=msg(messageIndex)}
function changeWaitTime(){if(Math.random()<.45)setEstimatedTime()}

function setAudioSource(src, phase){
  audioPhase=phase;
  holdMusic.pause();
  holdMusic.src=src;
  holdMusic.currentTime=0;
  holdMusic.volume=phase==='music' ? .34 : .72;
  holdMusic.load();
}
async function playCurrentAudio(){
  if(!callActive)return;
  try{await holdMusic.play()}catch(_){/* Browser may briefly defer loading; retry once. */
    if(callActive) window.setTimeout(()=>{holdMusic.play().catch(()=>{});},180);
  }
}
async function startMusicLoop(){
  if(!callActive)return;
  setAudioSource(MUSIC_SRC,'music');
  await playCurrentAudio();
}
async function startAnnouncement(){
  if(!callActive)return;
  setAudioSource(ANNOUNCEMENTS[announcementIndex],'announcement');
  await playCurrentAudio();
}

// CRITICAL: the music audio element is deliberately NOT looped.
// Every natural "ended" event of the music starts exactly one announcement.
// Only after that announcement has ended is the music restarted from 0:00.
holdMusic.addEventListener('ended',async()=>{
  if(!callActive)return;
  if(audioPhase==='music'){
    await startAnnouncement();
  }else{
    announcementIndex=(announcementIndex+1)%ANNOUNCEMENTS.length;
    await startMusicLoop();
  }
});

async function startCall(){
  contactButton.disabled=true;
  preCall.hidden=true;
  connecting.hidden=false;
  callActive=true;
  announcementIndex=0;
  await startMusicLoop();
  window.setTimeout(()=>{
    if(!callActive)return;
    queue=newQueuePosition();queueNumber.textContent=formatNumber(queue);messageIndex=0;queueMessage.textContent=msg(messageIndex);setEstimatedTime();connecting.hidden=true;activeCall.hidden=false;queueTimer=window.setInterval(changeQueue,8000);messageTimer=window.setInterval(changeMessage,11500);waitTimer=window.setInterval(changeWaitTime,29000)
  },1250)
}
function endCall(){
  callActive=false;
  window.clearInterval(queueTimer);window.clearInterval(messageTimer);window.clearInterval(waitTimer);queueTimer=messageTimer=waitTimer=null;
  holdMusic.pause();holdMusic.currentTime=0;
  setAudioSource(MUSIC_SRC,'music');
  activeCall.hidden=true;connecting.hidden=true;preCall.hidden=false;contactButton.disabled=false
}
window.addEventListener('wwg-languagechange',()=>{queueNumber.textContent=formatNumber(queue);queueMessage.textContent=msg(messageIndex);renderEstimated();});
contactButton.addEventListener('click',startCall);hangupButton.addEventListener('click',endCall);
})();
