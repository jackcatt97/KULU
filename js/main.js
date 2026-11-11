/* ------------------------------------------------------------------
   KULU site settings. Edit these, commit and push: Vercel redeploys.
   ------------------------------------------------------------------ */

// Formspree form ID: the last part of your form's endpoint, https://formspree.io/f/<ID>
const FORMSPREE_ID = "xkjjvzyz";

// Contact details shown in the "Say hello" section and in the form's error message
const CONFIG = {
  EMAIL: "info@kulugroup.co.za",
  WHATSAPP: "+27 63 281 7102",
  PARTNER_EMAIL: "taylor@kulugroup.co.za",

  // App store links. Leave empty until the app is live: the buttons and the
  // QR code (kulugroup.co.za/app) then show a "coming soon" page instead.
  APP_STORE_URL: "",
  PLAY_STORE_URL: "",

  // Opening hours used for the "Open now" badge (24-hour, South African time)
  OPENS: "08:00",
  CLOSES: "18:00"
};

/* ------------------------------------------------------------------ */

// Render contact details from CONFIG
function hrefFor(key, value) {
  if (key === "WHATSAPP") return "https://wa.me/" + value.replace(/\D/g, "");
  return "mailto:" + value;
}
document.querySelectorAll("[data-config]").forEach(function (a) {
  var value = CONFIG[a.dataset.config];
  if (!value) return;
  a.textContent = value;
  a.href = hrefFor(a.dataset.config, value);
});
var yr = document.getElementById("yr");
if (yr) yr.textContent = new Date().getFullYear();

// App store buttons: real store links once CONFIG has them
document.querySelectorAll("[data-store]").forEach(function (a) {
  var url = CONFIG[a.dataset.store], label = a.querySelector("[data-store-label]");
  if (url) a.href = url;
  else if (label) label.textContent = "Coming soon to";
});

// /app (the QR code target): send phones to the right store
if (document.body.hasAttribute("data-app-redirect")) {
  var ua = navigator.userAgent, target = "";
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) target = CONFIG.APP_STORE_URL;
  else if (/Android/.test(ua)) target = CONFIG.PLAY_STORE_URL;
  if (target) location.replace(target);
  else document.body.classList.add("show-stores");
}

// "Open now" badge from CONFIG.OPENS and CONFIG.CLOSES
document.querySelectorAll("[data-open-status]").forEach(function (el) {
  var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  var now = parts.replace(":", ""), open = CONFIG.OPENS.replace(":", ""), close = CONFIG.CLOSES.replace(":", "");
  var isOpen = now >= open && now < close, text = el.querySelector(".status-text");
  el.classList.toggle("open", isOpen);
  text.innerHTML = (isOpen ? "<b>Open now</b> · until " + CONFIG.CLOSES : "Closed now · opens " + CONFIG.OPENS) +
    (el.closest(".hero") ? " · KULU @FitLife" : "");
});

// Copy buttons
document.querySelectorAll("[data-copy]").forEach(function (b) {
  b.addEventListener("click", function () {
    var el = document.getElementById(b.dataset.copy), t = el.textContent.trim();
    function done() { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600); }
    function sel() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; }
    try { navigator.clipboard.writeText(t).then(done, sel); } catch (e) { sel(); }
  });
});

// Mobile menu
var menuBtn = document.querySelector(".menu-btn"), mnav = document.getElementById("mnav");
if (menuBtn && mnav) {
function setMenu(open) {
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.querySelector(".vh").textContent = open ? "Close menu" : "Menu";
  mnav.hidden = !open;
}
menuBtn.addEventListener("click", function () { setMenu(mnav.hidden); });
mnav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !mnav.hidden) { setMenu(false); menuBtn.focus(); }
});
document.addEventListener("click", function (e) {
  if (!mnav.hidden && !e.target.closest("nav")) setMenu(false);
});
matchMedia("(min-width: " + (mnav.dataset.bp || "641px") + ")").addEventListener("change", function (e) { if (e.matches) setMenu(false); });
}

// Form: enquiry type toggle
var form = document.getElementById("f");
if (form) {
var tp = document.getElementById("t-partner"), tn = document.getElementById("t-news"),
    sw = document.getElementById("site-wrap");
function sync() { sw.hidden = !tp.checked; }
tp.addEventListener("change", sync); tn.addEventListener("change", sync);

// "Book a site visit" scrolls to the form (via #hello) and picks the partner option
document.querySelectorAll("[data-partner]").forEach(function (a) {
  a.addEventListener("click", function () { tp.checked = true; sync(); });
});

// Form: send to Formspree
var ok = document.getElementById("f-ok"), err = document.getElementById("f-err"),
    sendBtn = form.querySelector('button[type="submit"]');
form.action = "https://formspree.io/f/" + FORMSPREE_ID;

form.addEventListener("submit", function (e) {
  e.preventDefault();
  var n = document.getElementById("f-name"), m = document.getElementById("f-email");
  if (!n.value.trim()) { n.focus(); return; }
  if (!m.value.includes("@")) { m.focus(); return; }

  var data = new FormData(form);
  if (!tp.checked) data.delete("site");
  data.append("_subject", "KULU website: " + data.get("enquiry_type"));

  ok.hidden = true; err.hidden = true;
  sendBtn.disabled = true; sendBtn.textContent = "Sending…";

  fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("Formspree responded " + res.status);
      form.reset(); sync();
      ok.hidden = false;
    })
    .catch(function () { err.hidden = false; })
    .finally(function () { sendBtn.disabled = false; sendBtn.textContent = "Send"; });
});
}
