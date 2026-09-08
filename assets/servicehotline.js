(() => {
  const preCall = document.getElementById('preCall');
  const connecting = document.getElementById('connecting');
  const activeCall = document.getElementById('activeCall');
  const contactButton = document.getElementById('contactButton');
  const hangupButton = document.getElementById('hangupButton');
  const queueNumber = document.getElementById('queueNumber');
  const queueMessage = document.getElementById('queueMessage');
  const estimatedTime = document.getElementById('estimatedTime');
  const holdMusic = document.getElementById('holdMusic');

  let queue = 187432;
  let queueTimer = null;
  let messageTimer = null;
  let waitTimer = null;

  const messages = [
    'Alle Wichtelsachbearbeiter befinden sich derzeit im Gespräch.',
    'Ihr Anliegen ist uns wichtig. Bitte bleiben Sie in der Leitung.',
    'Bitte halten Sie Ihr Aktenzeichen griffbereit.',
    'Eine Weiterleitung an den nächsten verfügbaren Wichtelsachbearbeiter erfolgt automatisch.',
    'Von wiederholten Nachfragen zum Bearbeitungsstand bitten wir abzusehen.',
    'Die zentrale Artigkeitsdatenbank wird derzeit planmäßig abgeglichen.',
    'Geschenkbezogene Eilanträge können gegenwärtig nicht priorisiert werden.',
    'Bitte haben Sie noch einen kleinen weihnachtlichen Augenblick Geduld.',
    'Ihre Verbindung zur Zentralen Dienststelle besteht weiterhin.',
    'Aus Qualitätsgründen kann dieses Gespräch möglicherweise von niemandem entgegengenommen werden.'
  ];

  function formatNumber(value) {
    return value.toLocaleString('de-DE');
  }

  function newQueuePosition() {
    // Jedes neue "Telefonat" liegt leicht woanders, bleibt aber glaubwürdig ähnlich.
    const deviation = Math.floor(Math.random() * 1701) - 850;
    return 187432 + deviation;
  }

  function setEstimatedTime() {
    const hours = 34 + Math.floor(Math.random() * 15);
    const minutes = Math.floor(Math.random() * 60);
    estimatedTime.textContent = `${hours} Stunden und ${minutes} Minuten`;
  }

  function changeQueue() {
    const r = Math.random();
    if (r < 0.57) {
      queue -= 1;
    } else if (r < 0.84) {
      queue -= 2 + Math.floor(Math.random() * 2);
    } else {
      // Behördenmagie: gelegentlich wird die Position sogar schlechter.
      queue += 1 + Math.floor(Math.random() * 4);
    }
    queueNumber.textContent = formatNumber(queue);
  }

  function changeMessage() {
    const current = queueMessage.textContent;
    let next = current;
    while (next === current && messages.length > 1) {
      next = messages[Math.floor(Math.random() * messages.length)];
    }
    queueMessage.textContent = next;
  }

  function changeWaitTime() {
    // Die Schätzung schwankt dezent – natürlich ohne erkennbaren Zusammenhang mit der Warteschlange.
    if (Math.random() < 0.45) setEstimatedTime();
  }

  async function startCall() {
    contactButton.disabled = true;
    preCall.hidden = true;
    connecting.hidden = false;

    // Die Musik startet direkt aus der Nutzerinteraktion heraus, damit Browser sie zulassen.
    holdMusic.currentTime = 0;
    holdMusic.volume = 0.34;
    try {
      await holdMusic.play();
    } catch (_) {
      // Falls ein sehr restriktiver Browser trotzdem blockiert, läuft die Seite ohne Ton weiter.
    }

    window.setTimeout(() => {
      queue = newQueuePosition();
      queueNumber.textContent = formatNumber(queue);
      setEstimatedTime();

      connecting.hidden = true;
      activeCall.hidden = false;

      queueTimer = window.setInterval(changeQueue, 8000);
      messageTimer = window.setInterval(changeMessage, 11500);
      waitTimer = window.setInterval(changeWaitTime, 29000);
    }, 1250);
  }

  function endCall() {
    window.clearInterval(queueTimer);
    window.clearInterval(messageTimer);
    window.clearInterval(waitTimer);
    queueTimer = messageTimer = waitTimer = null;

    holdMusic.pause();
    holdMusic.currentTime = 0;

    activeCall.hidden = true;
    connecting.hidden = true;
    preCall.hidden = false;
    contactButton.disabled = false;
  }

  contactButton.addEventListener('click', startCall);
  hangupButton.addEventListener('click', endCall);
})();
