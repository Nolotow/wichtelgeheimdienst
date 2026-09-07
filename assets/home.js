
const VALID_CASES = new Set(["WWG-PIK-2264-364", "WWG-FXM-3531-803", "WWG-RWP-6425-137", "WWG-IQR-0488-147", "WWG-YEI-4716-916", "WWG-VMB-6184-510", "WWG-SSU-5335-593", "WWG-FBU-0498-434", "WWG-GMK-0422-049"]);
const target = new Date("2026-12-24T00:00:00+01:00").getTime();

function pad(n, len=2) {
  return String(n).padStart(len, "0");
}

function updateCountdown() {
  let diff = target - Date.now();
  const el = document.getElementById("countdown");
  if (diff <= 0) {
    el.textContent = "000:00:00:00:000";
    return;
  }
  const days = Math.floor(diff / 86400000);
  diff %= 86400000;
  const hours = Math.floor(diff / 3600000);
  diff %= 3600000;
  const minutes = Math.floor(diff / 60000);
  diff %= 60000;
  const seconds = Math.floor(diff / 1000);
  const milliseconds = diff % 1000;

  el.textContent =
    pad(days, 3) + ":" +
    pad(hours) + ":" +
    pad(minutes) + ":" +
    pad(seconds) + ":" +
    pad(milliseconds, 3);
}

setInterval(updateCountdown, 31);
updateCountdown();

const form = document.getElementById("caseForm");
const input = document.getElementById("caseInput");
const error = document.getElementById("caseError");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const normalized = input.value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");

  if (VALID_CASES.has(normalized)) {
    window.location.href = "/" + normalized + "/";
    return;
  }

  error.textContent = "Aktenzeichen unbekannt oder ungültig.";
  input.focus();
});

input.addEventListener("input", () => {
  error.textContent = "";
});
