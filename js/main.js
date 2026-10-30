/* ------------------------------------------------------------------
   KULU site settings. Edit these, commit and push: Vercel redeploys.
   ------------------------------------------------------------------ */

// Formspree form ID: the last part of your form's endpoint, https://formspree.io/f/<ID>
const FORMSPREE_ID = "xkjjvzyz";

// Contact details shown in the "Say hello" section and in the form's error message
const CONFIG = {
  EMAIL: "info@kulugroup.co.za",
  WHATSAPP: "+27 63 281 7102",
  PARTNER_EMAIL: "taylor@kulugroup.co.za"
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
matchMedia("(min-width: 641px)").addEventListener("change", function (e) { if (e.matches) setMenu(false); });

// Form: enquiry type toggle
var form = document.getElementById("f"),
    tp = document.getElementById("t-partner"), tn = document.getElementById("t-news"),
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
