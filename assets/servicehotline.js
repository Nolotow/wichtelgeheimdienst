(()=>{
const preCall=document.getElementById('preCall'),connecting=document.getElementById('connecting'),activeCall=document.getElementById('activeCall'),contactButton=document.getElementById('contactButton'),hangupButton=document.getElementById('hangupButton'),queueNumber=document.getElementById('queueNumber'),queueMessage=document.getElementById('queueMessage'),estimatedTime=document.getElementById('estimatedTime'),holdMusic=document.getElementById('holdMusic');
let queue=187432,queueTimer=null,messageTimer=null,waitTimer=null,lastH=null,lastM=null,messageIndex=0,announcementIndex=0,currentAnnouncement=null,callActive=false;
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
const announcementFiles=Array.from({length:7},(_,i)=>`/assets/audio/ansagen/${lang()}-${i+1}.mp3`);
function stopAnnouncement(){if(currentAnnouncement){currentAnnouncement.pause();currentAnnouncement.currentTime=0;currentAnnouncement=null}}
async function resumeHoldMusic(){if(!callActive)return;holdMusic.currentTime=0;holdMusic.volume=.34;try{await holdMusic.play()}catch(_){}}
async function playAnnouncement(){
  if(!callActive)return;
  stopAnnouncement();
  const src=`/assets/audio/ansagen/${lang()}-${announcementIndex+1}.mp3`;
  currentAnnouncement=new Audio(src);
  currentAnnouncement.preload='auto';
  currentAnnouncement.volume=.72;
  currentAnnouncement.addEventListener('ended',()=>{
    currentAnnouncement=null;
    announcementIndex=(announcementIndex+1)%7;
    resumeHoldMusic();
  },{once:true});
  currentAnnouncement.addEventListener('error',()=>{
    currentAnnouncement=null;
    announcementIndex=(announcementIndex+1)%7;
    resumeHoldMusic();
  },{once:true});
  try{await currentAnnouncement.play()}catch(_){announcementIndex=(announcementIndex+1)%7;currentAnnouncement=null;resumeHoldMusic()}
}
holdMusic.addEventListener('ended',playAnnouncement);
async function startCall(){contactButton.disabled=true;preCall.hidden=true;connecting.hidden=false;callActive=true;announcementIndex=0;stopAnnouncement();holdMusic.currentTime=0;holdMusic.volume=.34;try{await holdMusic.play()}catch(_){}window.setTimeout(()=>{queue=newQueuePosition();queueNumber.textContent=formatNumber(queue);messageIndex=0;queueMessage.textContent=msg(messageIndex);setEstimatedTime();connecting.hidden=true;activeCall.hidden=false;queueTimer=window.setInterval(changeQueue,8000);messageTimer=window.setInterval(changeMessage,11500);waitTimer=window.setInterval(changeWaitTime,29000)},1250)}
function endCall(){callActive=false;stopAnnouncement();window.clearInterval(queueTimer);window.clearInterval(messageTimer);window.clearInterval(waitTimer);queueTimer=messageTimer=waitTimer=null;holdMusic.pause();holdMusic.currentTime=0;activeCall.hidden=true;connecting.hidden=true;preCall.hidden=false;contactButton.disabled=false}
window.addEventListener('wwg-languagechange',()=>{queueNumber.textContent=formatNumber(queue);queueMessage.textContent=msg(messageIndex);renderEstimated();});
contactButton.addEventListener('click',startCall);hangupButton.addEventListener('click',endCall);
})();