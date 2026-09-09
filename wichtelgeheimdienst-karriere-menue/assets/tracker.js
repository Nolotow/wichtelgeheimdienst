(() => {
  const API = String(window.WWG_BACKEND_URL || "").replace(/\/$/, "");
  const match = location.pathname.match(/\/(WWG-[A-Z]{3}-\d{4}-\d{3})(?:\/|$)/i);
  if (!API || API.includes("DEIN-WWG-WORKER") || !match) return;

  const caseId = match[1].toUpperCase();
  const qs = new URLSearchParams(location.search);
  let source = (qs.get("src") || "").toLowerCase();
  if (!['qr','manual','direct'].includes(source)) source = 'direct';

  const ua = navigator.userAgent || '';
  const device = /iPad|Tablet/i.test(ua) ? 'tablet' : /Android|iPhone|Mobile/i.test(ua) ? 'mobile' : 'desktop';

  function send(eventType) {
    try {
      fetch(API + '/track', {
        method: 'POST',
        mode: 'cors',
        keepalive: true,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({caseId, eventType, source, device})
      }).catch(() => {});
    } catch (_) {}
  }

  window.WWG_TRACK = send;
  window.addEventListener('load', () => send('page_view'), {once:true});
})();
