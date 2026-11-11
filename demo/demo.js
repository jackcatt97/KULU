/* KULU scroll demo: a little car drives through a KULU day as you scroll.
   Everything is driven by scroll progress p (0 to 1). World units: the ground
   line for the car is y = 586; the scene is 600 units tall and as wide as needed. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("scene");
  var stage = document.querySelector(".stage");
  var scroller = document.getElementById("scroller");
  var GY = 586;               // car ground line
  var CAR_W = 190;
  var LIME = "#D3FD5C";

  /* ---------- helpers ---------- */
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function clamp(v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function bump(a, b, v, edge) { edge = edge || (b - a) * .25; return smooth(a, a + edge, v) * (1 - smooth(b - edge, b, v)); }
  function backOut(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(c1, c2, t) { var a = hex(c1), b = hex(c2); return "rgb(" + a.map(function (v, i) { return Math.round(lerp(v, b[i], t)); }).join(",") + ")"; }
  function ramp(stops, v) { // stops: [[p, value], ...] colours
    for (var i = 0; i < stops.length - 1; i++) if (v <= stops[i + 1][0]) return mix(stops[i][1], stops[i + 1][1], smooth(stops[i][0], stops[i + 1][0], v));
    return stops[stops.length - 1][1];
  }
  function $(id) { return document.getElementById(id); }

  /* ---------- the journey: car x position by scroll progress (equal x = a stop) ---------- */
  var KEYS = [[0, 300], [.06, 300], [.2, 1457], [.42, 1457], [.52, 2900], [.62, 2900], [.67, 3870], [.71, 3870],
              [.75, 4520], [.79, 4520], [.83, 5170], [.87, 5170], [.93, 5900], [1, 5900]];
  function carAt(p) {
    for (var i = 0; i < KEYS.length - 1; i++) {
      var a = KEYS[i], b = KEYS[i + 1];
      if (p <= b[0]) return { x: lerp(a[1], b[1], ease(clamp((p - a[0]) / (b[0] - a[0])))), moving: a[1] !== b[1] && p > a[0] };
    }
    return { x: KEYS[KEYS.length - 1][1], moving: false };
  }

  /* ---------- scene pieces ---------- */
  function logo(href, x, y, w, h) { return '<image href="' + href + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>'; }
  var LOGO_W = "/assets/logos/kulu-logo-white.svg", LOGO_B = "/assets/logos/kulu-logo-black.svg";
  var TXT = 'font-family="Archivo, Arial Black, sans-serif" style="font-stretch:125%"';

  function mountains() {
    var s = "";
    for (var i = 0; i < 4; i++) {
      var o = i * 1150;
      s += '<path d="M' + o + ' 470 L' + o + ' 360 L' + (o + 140) + ' 320 L' + (o + 210) + ' 236 L' + (o + 250) + ' 226 L' + (o + 600) + ' 222 L' + (o + 640) + ' 236 L' + (o + 700) + ' 290 L' + (o + 760) + ' 270 L' + (o + 820) + ' 300 L' + (o + 960) + ' 360 L' + (o + 1150) + ' 380 L' + (o + 1150) + ' 470Z"/>';
    }
    return s;
  }
  function hills() {
    var d = "M-100 470 L-100 410";
    for (var x = -100; x <= 3400; x += 50) d += " L" + x + " " + (410 - 26 * Math.sin(x / 180) - 14 * Math.sin(x / 67));
    return '<path d="' + d + ' L3400 470Z"/>';
  }
  function city() {
    var s = "", w = "";
    seed = 11;
    for (var x = -60; x < 4400;) {
      var bw = 40 + rnd() * 70, bh = 36 + rnd() * 96;
      s += '<rect x="' + x.toFixed(0) + '" y="' + (470 - bh).toFixed(0) + '" width="' + bw.toFixed(0) + '" height="' + bh.toFixed(0) + '"/>';
      for (var wy = 470 - bh + 10; wy < 455; wy += 16) for (var wx = x + 8; wx < x + bw - 10; wx += 14) if (rnd() > .72) w += '<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="6" height="8"/>';
      x += bw + 4 + rnd() * 30;
    }
    return '<g fill="#252a36" opacity=".85">' + s + '</g><g class="lit" fill="#ffd98a">' + w + '</g>';
  }
  function lamps() {
    var s = "";
    for (var x = 200; x < 6700; x += 380) {
      if (x > 1380 && x < 1760) continue;
      s += '<rect x="' + x + '" y="340" width="5" height="132" fill="#2b2b2b"/><path d="M' + (x + 2) + ' 342 h26" stroke="#2b2b2b" stroke-width="4"/><rect x="' + (x + 20) + '" y="340" width="18" height="6" rx="2" fill="#3a3a3a"/>' +
           '<circle class="glow" cx="' + (x + 29) + '" cy="352" r="26" fill="#ffe9a8" filter="url(#blur)"/>';
    }
    return s;
  }
  function dashes() { var s = ""; for (var x = -400; x < 7200; x += 90) s += '<rect x="' + x + '" y="538" width="46" height="4"/>'; return s; }
  function palm(x, h) {
    h = h || 120;
    var top = 470 - h, s = '<path d="M' + x + ' 470 Q' + (x + 10) + ' ' + (470 - h / 2) + ' ' + (x + 4) + ' ' + top + '" stroke="#3a2c20" stroke-width="7" fill="none"/>';
    [[-60, 10], [-40, -18], [0, -26], [42, -16], [60, 12]].forEach(function (l) {
      s += '<path d="M' + (x + 4) + ' ' + top + ' Q' + (x + 4 + l[0] / 2) + ' ' + (top + l[1] - 14) + ' ' + (x + 4 + l[0]) + ' ' + (top + l[1] + 18) + '" stroke="#1f3b2c" stroke-width="9" stroke-linecap="round" fill="none"/>';
    });
    return s;
  }
  function roadSign(x, a, b) {
    return '<rect x="' + (x + 38) + '" y="410" width="5" height="62" fill="#555"/><rect x="' + x + '" y="372" width="82" height="44" rx="5" fill="#0f5b3a" stroke="#fff" stroke-width="2"/>' +
      '<text x="' + (x + 41) + '" y="391" fill="#fff" font-size="13" font-weight="900" text-anchor="middle" ' + TXT + '>' + a + '</text>' +
      '<text x="' + (x + 41) + '" y="408" fill="#fff" font-size="11" font-weight="600" text-anchor="middle" font-family="Archivo, Arial, sans-serif">' + b + '</text>';
  }
  function miniCar(x, y, c) { return '<path d="M' + x + ' ' + y + ' v-10 q2 -6 10 -7 l8 -9 h22 q8 0 12 9 q8 1 8 7 v10z" fill="' + c + '"/><circle cx="' + (x + 12) + '" cy="' + y + '" r="5" fill="#111"/><circle cx="' + (x + 46) + '" cy="' + y + '" r="5" fill="#111"/>'; }

  function plot(cx, name, bays, nBays, extras) {
    var x0 = cx - 250, s = '<rect x="' + x0 + '" y="462" width="500" height="10" fill="#2e2e2e"/>';
    for (var t = x0 + 10; t < x0 + 500; t += 50) s += '<rect x="' + t + '" y="462" width="2" height="10" fill="#555"/>';
    // container
    s += '<rect x="' + x0 + '" y="404" width="120" height="58" rx="3" fill="#0d0d0d" stroke="#333"/>' + logo(LOGO_W, x0 + 22, 418, 76, 31);
    // canopy with bays
    var cx0 = x0 + 135, bw = 70, cw = nBays * bw;
    s += '<rect x="' + (cx0 - 4) + '" y="372" width="' + (cw + 8) + '" height="12" fill="#0d0d0d"/>';
    for (var i = 0; i <= nBays; i++) s += '<rect x="' + (cx0 + i * bw - 3) + '" y="384" width="6" height="78" fill="#0d0d0d"/>';
    for (i = 0; i < nBays; i++) s += miniCar(cx0 + i * bw + 6, 458, ["#e9e9e4", "#8fa3b8", "#c84b3a"][i % 3]);
    var ex = cx0 + cw + 14;
    if (extras.indexOf("pod") > -1) { s += '<rect x="' + ex + '" y="420" width="44" height="42" rx="3" fill="#f2f2ee"/><rect x="' + (ex + 8) + '" y="430" width="28" height="12" fill="#333"/>'; ex += 54; }
    if (extras.indexOf("coffee") > -1) { s += '<rect x="' + ex + '" y="404" width="90" height="58" rx="3" fill="#f2f2ee"/><path d="M' + (ex + 20) + ' 414 h50 l6 10 h-62z" fill="' + LIME + '"/>'; ex += 100; }
    if (extras.indexOf("locker") > -1) { s += '<rect x="' + ex + '" y="414" width="34" height="48" fill="#3a3a3a"/>'; for (i = 0; i < 4; i++) s += '<rect x="' + (ex + 4) + '" y="' + (418 + i * 11) + '" width="26" height="8" fill="#555"/>'; }
    // sign
    s += '<text x="' + cx + '" y="336" fill="#fff" font-size="40" font-weight="900" text-anchor="middle" ' + TXT + '>' + name + '</text>' +
         '<text x="' + cx + '" y="360" fill="' + LIME + '" font-size="15" font-weight="700" text-anchor="middle" font-family="Archivo, Arial, sans-serif">Fits about ' + bays + ' bays</text>';
    return '<g class="plot">' + s + '</g>';
  }

  function car() {
    var body = "M8 -16 C2 -16 0 -20 0 -28 L0 -36 C0 -44 6 -48 16 -50 L52 -54 C64 -72 80 -82 104 -82 L132 -82 C150 -82 160 -70 168 -54 L178 -52 C186 -50 190 -44 190 -36 L190 -24 C190 -18 186 -16 182 -16 Z";
    seed = 3;
    var dirt = "";
    for (var i = 0; i < 22; i++) dirt += '<ellipse cx="' + (8 + rnd() * 178).toFixed(0) + '" cy="' + (-18 - rnd() * 40).toFixed(0) + '" rx="' + (4 + rnd() * 9).toFixed(0) + '" ry="' + (3 + rnd() * 6).toFixed(0) + '"/>';
    var foam = "";
    seed = 5;
    for (i = 0; i < 26; i++) foam += '<circle class="b" cx="' + (6 + rnd() * 178).toFixed(0) + '" cy="' + (-20 - rnd() * 68).toFixed(0) + '" r="' + (6 + rnd() * 10).toFixed(0) + '"/>';
    var spark = "";
    [[20, -96, 1], [170, -92, .8], [96, -112, 1.2], [200, -40, .7], [-12, -50, .8], [140, -120, .7]].forEach(function (s, k) {
      spark += '<path class="s" data-k="' + k + '" transform="translate(' + s[0] + ' ' + s[1] + ') scale(' + s[2] + ')" d="M0 -12 C1 -3 3 -1 12 0 C3 1 1 3 0 12 C-1 3 -3 1 -12 0 C-3 -1 -1 -3 0 -12Z"/>';
    });
    function wheel(id, x) {
      return '<g transform="translate(' + x + ' -17)"><g id="' + id + '"><circle r="17" fill="#121212"/><circle r="9.5" fill="#d8d8d8"/><path d="M0 -9 V9 M-9 0 H9" stroke="#8a8a8a" stroke-width="2.4"/><circle r="3" fill="#555"/></g></g>';
    }
    return '<g id="car">' +
      '<path id="beam" d="M188 -40 L520 -90 L520 20 Z" fill="url(#beamGrad)" opacity="0"/>' +
      '<ellipse cx="95" cy="2" rx="96" ry="6" fill="rgba(0,0,0,.35)"/>' +
      '<g id="puffs" fill="#9a9a9a"><circle r="6"/><circle r="8"/><circle r="10"/></g>' +
      '<g id="carBody">' +
        '<clipPath id="carClip"><path d="' + body + '"/></clipPath>' +
        '<path d="' + body + '" fill="' + LIME + '"/>' +
        '<path d="M8 -16 h174 c4 0 8 -2 8 -8 v-6 H0 v6 c0 6 4 8 8 8z" fill="rgba(0,0,0,.12)"/>' +
        '<path d="M60 -54 C70 -70 84 -76 102 -76 L112 -76 L112 -54 Z M118 -76 L132 -76 C146 -76 154 -66 160 -54 L118 -54 Z" fill="#16181d"/>' +
        '<circle id="driver" cx="100" cy="-62" r="7.5" fill="#3a3a3a"/>' +
        '<path d="M66 -58 L76 -70" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M114 -52 V-20 M58 -52 V-22" stroke="rgba(0,0,0,.25)" stroke-width="1.6"/><rect x="122" y="-44" width="12" height="3" rx="1.5" fill="rgba(0,0,0,.4)"/>' +
        '<rect x="181" y="-44" width="8" height="7" rx="2" fill="#fff6c8"/><rect id="tail" x="1" y="-44" width="6" height="8" rx="2" fill="#c23b2a"/>' +
        '<g id="dirt" clip-path="url(#carClip)" fill="#6b4a2b">' + dirt + '</g>' +
      '</g>' +
      wheel("w1", 46) + wheel("w2", 150) +
      '<g id="foam" fill="#fff" stroke="#dfe9f2" stroke-width="1.5">' + foam + '</g>' +
      '<g id="spark" fill="#fff">' + spark + '</g>' +
      '<g id="ready" transform="translate(95 -150)"><g id="readyIn"><rect x="-98" y="-22" width="196" height="44" rx="22" fill="#0A0A0A" stroke="' + LIME + '" stroke-width="2"/>' +
        '<circle cx="-74" cy="0" r="11" fill="' + LIME + '"/><path d="M-79 0 l4 4 l7 -8" stroke="#0A0A0A" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="-56" y="5" fill="#fff" font-size="14" font-weight="700" font-family="Archivo, Arial, sans-serif">Your car is ready</text>' +
        '<path d="M-6 22 l6 8 l6 -8z" fill="#0A0A0A"/></g></g>' +
    '</g>';
  }

  function person() {
    return '<g id="person"><g id="personIn">' +
      '<path id="legL" d="M0 0 L0 14" stroke="#f4f4f0" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path id="legR" d="M0 0 L0 14" stroke="#f4f4f0" stroke-width="3.5" stroke-linecap="round"/>' +
      '<rect x="-5" y="-18" width="10" height="20" rx="4" fill="#f4f4f0"/>' +
      '<circle cx="0" cy="-25" r="6" fill="#f4f4f0"/>' +
      '<g id="bag"><rect x="5" y="-8" width="10" height="11" rx="1.5" fill="' + LIME + '"/><path d="M7 -8 q3 -5 6 0" stroke="' + LIME + '" stroke-width="1.5" fill="none"/></g>' +
    '</g></g>';
  }

  function build() {
    var s = '<defs>' +
      '<filter id="blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="soft" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="22"/></filter>' +
      '<linearGradient id="beamGrad" x1="0" x2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient>' +
    '</defs>' +
    // sky layer (screen space, positioned on resize and each frame)
    '<g id="sky"><g id="stars" fill="#fff"></g><circle id="sunGlow" r="90" filter="url(#soft)"/><circle id="sun" r="38"/><g id="moon"><circle r="26" fill="#f4f1e6"/><circle cx="12" cy="-6" r="24" style="fill:var(--sky-top)" id="moonCut"/></g></g>' +
    '<g id="clouds" fill="#fff">' + [[120, 150, 1], [620, 90, .7], [1050, 170, .9], [1500, 110, .6], [1900, 160, .8]].map(function (c) {
      return '<g transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')"><ellipse rx="60" ry="18"/><ellipse cx="-30" cy="-10" rx="30" ry="18"/><ellipse cx="20" cy="-16" rx="34" ry="22"/></g>';
    }).join("") + '</g>' +
    '<g id="mtn" fill="rgba(22,26,40,.38)">' + mountains() + '</g>' +
    '<g id="hills" fill="rgba(22,26,40,.55)">' + hills() + '</g>' +
    '<g id="city">' + city() + '</g>' +
    '<g id="world">' +
      // ground
      '<rect x="-1000" y="470" width="9000" height="20" fill="#3b3b3b"/><rect x="-1000" y="488" width="9000" height="3" fill="#555"/>' +
      '<rect x="-1000" y="491" width="9000" height="200" fill="#151515"/>' +
      '<g fill="' + LIME + '" opacity=".8">' + dashes() + '</g>' +
      '<g id="lamps">' + lamps() + '</g>' +
      palm(620, 130) + palm(2560, 110) + palm(3420, 140) + palm(5680, 120) + palm(6420, 130) +
      roadSign(860, "KULU", "500 m →") + roadSign(3300, "Plans", "this way →") +
      // the mall and gym
      '<g id="mall"><rect x="1760" y="250" width="440" height="220" fill="#20232b"/><rect x="1760" y="250" width="440" height="44" fill="#14161b"/>' +
        '<text x="1980" y="284" fill="#fff" font-size="30" font-weight="900" text-anchor="middle" letter-spacing="6" ' + TXT + '>SHOP</text><rect x="1930" y="290" width="100" height="4" fill="' + LIME + '"/>' +
        '<g class="lit" fill="#ffd98a">' + (function () { var r = ""; for (var y = 312; y < 390; y += 40) for (var x = 1784; x < 2180; x += 46) if (!(x > 1840 && x < 1920 && y > 350)) r += '<rect x="' + x + '" y="' + y + '" width="30" height="24"/>'; return r; })() + '</g>' +
        '<rect x="1858" y="404" width="54" height="66" fill="#4b6170"/><path d="M1885 404 V470" stroke="#20232b" stroke-width="3"/></g>' +
      '<g id="gym"><rect x="2230" y="318" width="220" height="152" fill="#1b1d22"/><rect x="2230" y="318" width="220" height="36" fill="#121317"/>' +
        '<text x="2340" y="345" fill="#fff" font-size="22" font-weight="900" text-anchor="middle" letter-spacing="4" ' + TXT + '>GYM</text>' +
        '<g fill="' + LIME + '"><rect x="2266" y="331" width="6" height="16" rx="2"/><rect x="2272" y="336" width="14" height="6"/><rect x="2286" y="331" width="6" height="16" rx="2"/></g>' +
        '<g class="lit" fill="#ffd98a"><rect x="2250" y="370" width="80" height="40"/><rect x="2350" y="370" width="80" height="40"/></g><rect x="2318" y="420" width="44" height="50" fill="#4b6170"/></g>' +
      // KULU wash: container + canopy (back posts)
      '<g id="wash"><rect x="1168" y="360" width="216" height="110" rx="4" fill="#0d0d0d" stroke="#2a2a2a"/>' +
        (function () { var r = ""; for (var x = 1178; x < 1380; x += 10) r += '<path d="M' + x + ' 364 V466" stroke="#191919" stroke-width="2"/>'; return r; })() +
        logo(LOGO_W, 1186, 378, 104, 42) +
        '<rect x="1316" y="388" width="50" height="36" fill="#2c2c2c" stroke="#444"/><text x="1341" y="440" fill="#fff" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1" font-family="Archivo, Arial, sans-serif">KEY DROP</text>' +
        '<rect x="1402" y="304" width="8" height="186" fill="#0b0b0b"/><rect x="1714" y="304" width="8" height="186" fill="#0b0b0b"/>' +
        '<rect x="1394" y="292" width="336" height="28" fill="#0b0b0b"/>' + logo(LOGO_W, 1408, 296, 48, 20) +
        '<text x="1468" y="311" fill="#fff" font-size="10" font-weight="700" letter-spacing="2" font-family="Archivo, Arial, sans-serif">CARWASH · SHOP. WE WASH.</text>' +
        '<g fill="#333"><rect x="1490" y="320" width="10" height="8"/><rect x="1556" y="320" width="10" height="8"/><rect x="1622" y="320" width="10" height="8"/></g>' +
        '<rect x="1398" y="589" width="330" height="4" fill="' + LIME + '"/>' +
        '<text x="1563" y="520" fill="rgba(255,255,255,.12)" font-size="40" font-weight="900" text-anchor="middle" ' + TXT + '>01</text>' +
      '</g>' +
      '<g id="spray"><path d="M1490 328 L1462 520 L1528 520 Z M1556 328 L1528 520 L1594 520 Z M1622 328 L1594 520 L1660 520 Z"/></g>' +
      // KULU coffee
      '<g id="coffee"><rect x="2770" y="364" width="232" height="106" rx="4" fill="#f2f2ee"/>' +
        (function () { var r = ""; for (var x = 2780; x < 2998; x += 10) r += '<path d="M' + x + ' 368 V466" stroke="#e1e1dc" stroke-width="2"/>'; return r; })() +
        '<rect x="2860" y="386" width="96" height="44" fill="#222"/><circle cx="2890" cy="414" r="8" fill="#5a4636"/><rect x="2882" y="420" width="16" height="10" fill="#0A0A0A"/>' +
        '<path d="M2850 384 H2966 L2976 398 H2840 Z" fill="' + LIME + '"/>' +
        logo("/assets/logos/kulu-coffee-black.svg", 2786, 440, 120, 21) +
        '<g><path d="M3046 470 v-26 M3106 470 v-26" stroke="#555" stroke-width="3"/><ellipse cx="3046" cy="444" rx="16" ry="4" fill="#ddd"/><ellipse cx="3106" cy="444" rx="16" ry="4" fill="#ddd"/>' +
          '<path d="M3076 470 V392" stroke="#555" stroke-width="3"/><path d="M3030 400 Q3076 370 3122 400 Z" fill="' + LIME + '"/></g>' +
        '<g id="cup" transform="translate(3076 330)"><g id="cupIn">' +
          '<path id="st1" d="M-10 -40 q-8 -12 0 -24 q8 -12 0 -24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<path id="st2" d="M6 -40 q-8 -12 0 -24 q8 -12 0 -24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
          '<path d="M-28 -34 h56 l-7 52 q-1 8 -9 8 h-24 q-8 0 -9 -8 z" fill="#fff"/><rect x="-30" y="-40" width="60" height="9" rx="3" fill="#e6e6e1"/>' +
          '<path d="M-25 -12 h50 l-3 22 h-44 z" fill="' + LIME + '"/><text x="0" y="5" fill="#0A0A0A" font-size="11" font-weight="900" text-anchor="middle" ' + TXT + '>KULU</text>' +
        '</g></g></g>' +
      // plans
      plot(3965, "KUNYE", 4, 1, []) + plot(4615, "PEDI", 7, 2, ["pod"]) + plot(5265, "DRIE", 10, 3, ["coffee", "locker"]) +
      // finale billboard
      '<g id="finale"><rect x="5888" y="436" width="6" height="36" fill="#333"/><rect x="6098" y="436" width="6" height="36" fill="#333"/>' +
        '<rect id="boardGlow" x="5846" y="322" width="300" height="118" rx="10" fill="' + LIME + '" filter="url(#blur)" opacity="0"/>' +
        '<rect x="5846" y="322" width="300" height="118" rx="10" fill="#0A0A0A" stroke="' + LIME + '" stroke-width="3"/>' + logo(LOGO_W, 5896, 338, 200, 81) + '</g>' +
      '<g id="confetti"></g>' +
      person() + car() +
      // foreground canopy posts (in front of the car)
      '<rect x="1398" y="300" width="12" height="300" fill="#0b0b0b"/><rect x="1716" y="300" width="12" height="300" fill="#0b0b0b"/>' +
    '</g>';
    svg.innerHTML = s;

    // confetti pieces
    seed = 9;
    var conf = "", cols = [LIME, "#fff", "#ffd98a", LIME];
    for (var i = 0; i < 36; i++) conf += '<rect width="' + (5 + rnd() * 5).toFixed(0) + '" height="' + (8 + rnd() * 6).toFixed(0) + '" fill="' + cols[i % 4] + '" data-vx="' + ((rnd() - .5) * 520).toFixed(0) + '" data-vy="' + (-260 - rnd() * 320).toFixed(0) + '" data-r="' + (rnd() * 720).toFixed(0) + '"/>';
    $("confetti").innerHTML = conf;
  }

  /* ---------- layout ---------- */
  var VW = 1000, VH = 600, mobile = false, stars = [];
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    mobile = w < 700;
    var scale = Math.min(h / 600, w / (mobile ? 560 : 900));
    VW = w / scale; VH = h / scale;
    svg.setAttribute("viewBox", "0 " + (600 - VH).toFixed(1) + " " + VW.toFixed(1) + " " + VH.toFixed(1));
    seed = 21; var st = "";
    for (var i = 0; i < 90; i++) st += '<circle cx="' + (rnd() * VW).toFixed(0) + '" cy="' + (600 - VH + rnd() * (VH - 220)).toFixed(0) + '" r="' + (.6 + rnd() * 1.4).toFixed(1) + '"/>';
    $("stars").innerHTML = st;
    update(true);
  }

  /* ---------- per-frame update ---------- */
  var els = {}, cards = [], chapters = [], last = -1;
  function cache() {
    ["sky", "sun", "sunGlow", "moon", "stars", "clouds", "mtn", "hills", "city", "world", "car", "carBody", "w1", "w2", "dirt", "foam", "spark", "spray", "driver", "person", "personIn", "legL", "legR", "bag", "ready", "readyIn", "cupIn", "st1", "st2", "beam", "puffs", "boardGlow", "confetti", "tail"].forEach(function (id) { els[id] = $(id); });
    els.bubbles = [].slice.call(els.foam.children);
    els.sparks = [].slice.call(els.spark.children);
    els.puff = [].slice.call(els.puffs.children);
    els.conf = [].slice.call(els.confetti.children);
    els.lit = [].slice.call(svg.querySelectorAll(".lit, .glow"));
    cards = [].slice.call(document.querySelectorAll(".card"));
    chapters = [].slice.call(document.querySelectorAll(".chapters button"));
  }
  function progress() {
    var max = scroller.offsetHeight - window.innerHeight;
    return clamp(window.scrollY / (max || 1));
  }
  function tf(el, s) { el.setAttribute("transform", s); }

  function update(force) {
    var p = progress();
    if (!force && Math.abs(p - last) < 1e-5) return;
    last = p;

    // sky colour through the day
    stage.style.setProperty("--sky-top", ramp([[0, "#1d2140"], [.18, "#4fa3d9"], [.5, "#3d8ccc"], [.74, "#3b2a52"], [.9, "#141428"], [1, "#070708"]], p));
    stage.style.setProperty("--sky-bot", ramp([[0, "#f2a65a"], [.18, "#cfeaf5"], [.5, "#f7d9a0"], [.74, "#f0805a"], [.9, "#4a2f4f"], [1, "#1a1a22"]], p));
    var night = Math.max(smooth(.78, .95, p), .6 * (1 - smooth(0, .12, p)));
    var top = 600 - VH, s = clamp(p / .86);
    var sunX = VW * (.12 + .76 * s), sunY = top + VH * (.62 - .42 * Math.sin(Math.PI * s));
    var sunC = ramp([[0, "#ffb36b"], [.2, "#fff3c4"], [.6, "#ffe08a"], [.8, "#ff7b54"]], p);
    var sunO = 1 - smooth(.8, .9, p);
    ["sun", "sunGlow"].forEach(function (k) { els[k].setAttribute("cx", sunX); els[k].setAttribute("cy", sunY); els[k].setAttribute("fill", sunC); els[k].style.opacity = sunO * (k === "sunGlow" ? .6 : 1); });
    tf(els.moon, "translate(" + (VW * .8) + " " + (top + VH * .2) + ")");
    els.moon.style.opacity = smooth(.86, .95, p);
    els.stars.style.opacity = smooth(.82, .96, p) + .5 * (1 - smooth(0, .1, p));
    els.clouds.style.opacity = .55 * (1 - night);
    els.lit.forEach(function (e) { e.style.opacity = .12 + .88 * night; });

    // car and camera
    var c = carAt(p), x = c.x;
    // desktop: keep the car clear of the story card; during the plans, show each plot to the right of its card
    var anchor = mobile ? .5 : lerp(lerp(.42, .64, bump(.62, .9, p, .03)), .5, smooth(.9, .95, p));
    var cam = Math.max(-80, x + CAR_W / 2 - VW * anchor);
    tf(els.world, "translate(" + (-cam).toFixed(1) + " 0)");
    tf(els.clouds, "translate(" + (-cam * .05).toFixed(1) + " 0)");
    tf(els.mtn, "translate(" + (-cam * .12).toFixed(1) + " 0)");
    tf(els.hills, "translate(" + (-cam * .25).toFixed(1) + " 0)");
    tf(els.city, "translate(" + (-cam * .5).toFixed(1) + " 0)");
    tf(els.car, "translate(" + x.toFixed(1) + " " + GY + ")");
    var bob = c.moving ? Math.sin(x * .12) * 1.3 : 0;
    tf(els.carBody, "translate(0 " + bob.toFixed(2) + ")");
    var ang = (x / 17) * 57.3;
    tf(els.w1, "rotate(" + ang.toFixed(1) + ")"); tf(els.w2, "rotate(" + ang.toFixed(1) + ")");
    els.puff.forEach(function (pf, i) {
      var t = ((x * .02 + i / 3) % 1);
      pf.setAttribute("cx", (-8 - t * 50).toFixed(1)); pf.setAttribute("cy", (-22 - t * 18).toFixed(1));
      pf.style.opacity = c.moving ? (1 - t) * .45 : 0;
    });
    els.beam.style.opacity = night * .9;
    els.tail.setAttribute("fill", night > .3 ? "#ff5a45" : "#c23b2a");

    // the wash (local progress w)
    var w = clamp((p - .2) / .22);
    var inWash = p > .2 && p < .42;
    els.dirt.style.opacity = 1 - smooth(.32, .6, w);
    var foamAmt = smooth(.16, .34, w) * (1 - smooth(.46, .6, w));
    els.bubbles.forEach(function (b, i) {
      var k = clamp(foamAmt * 1.5 - (i % 9) * .05);
      b.setAttribute("transform", "translate(" + b.getAttribute("cx") + " " + b.getAttribute("cy") + ") scale(" + k.toFixed(3) + ") translate(" + (-b.getAttribute("cx")) + " " + (-b.getAttribute("cy")) + ")");
    });
    var soap = bump(.12, .3, w), rinse = bump(.44, .62, w);
    els.spray.style.opacity = inWash ? Math.max(soap, rinse) * .6 : 0;
    els.spray.setAttribute("fill", rinse > soap ? "#9fd4ff" : "#ffffff");
    var sparkle = inWash ? bump(.64, .97, w, .06) : 0;
    els.sparks.forEach(function (sp, i) { sp.style.opacity = sparkle * (.5 + .5 * Math.sin(w * 60 + i * 1.7)); });
    var ready = inWash ? backOut(clamp((w - .74) / .1)) * (1 - smooth(.97, 1, w)) : 0;
    tf(els.readyIn, "scale(" + Math.max(0, ready).toFixed(3) + ")");

    // the driver walks to the shops and back
    var out = inWash && w > .06 && w < .97;
    els.driver.style.opacity = out ? 0 : 1;
    var doorX = 1885, carDoor = x + 112, px = carDoor, dir = 1, pO = 0, bag = 0;
    if (inWash) {
      if (w < .36) { px = lerp(carDoor, doorX, ease(clamp((w - .06) / .26))); pO = smooth(.06, .09, w) * (1 - smooth(.32, .36, w)); }
      else if (w > .8) { px = lerp(doorX, carDoor, ease(clamp((w - .8) / .15))); pO = smooth(.8, .83, w) * (1 - smooth(.94, .97, w)); dir = -1; bag = 1; }
    }
    tf(els.person, "translate(" + px.toFixed(1) + " 470) scale(" + (1.5 * dir) + " 1.5)");
    els.person.style.opacity = pO;
    els.bag.style.opacity = bag;
    var stepA = Math.sin(px * .25) * 28;
    tf(els.legL, "rotate(" + stepA.toFixed(1) + ")"); tf(els.legR, "rotate(" + (-stepA).toFixed(1) + ")");

    // coffee stop
    var cf = clamp((p - .5) / .12);
    var cupS = p > .5 && p < .64 ? backOut(clamp(cf / .3)) * (1 - smooth(.9, 1, cf)) : 0;
    tf(els.cupIn, "translate(0 " + (Math.sin(cf * 12) * 3).toFixed(1) + ") scale(" + Math.max(0, cupS).toFixed(3) + ")");
    [els.st1, els.st2].forEach(function (st, i) {
      var t = (cf * 4 + i * .5) % 1;
      tf(st, "translate(0 " + (-t * 22).toFixed(1) + ")"); st.style.opacity = (1 - t) * .9;
    });

    // finale
    var fin = clamp((p - .92) / .08);
    els.boardGlow.style.opacity = smooth(.88, .96, p) * (.6 + .2 * Math.sin(p * 400));
    var cx0 = 5995, cy0 = GY - 60;
    els.conf.forEach(function (r) {
      var t = fin * 1.4, vx = +r.dataset.vx, vy = +r.dataset.vy;
      var rx = cx0 + vx * t * .55, ry = cy0 + vy * t * .55 + 380 * t * t * .55;
      tf(r, "translate(" + rx.toFixed(1) + " " + Math.min(ry, GY).toFixed(1) + ") rotate(" + (r.dataset.r * t).toFixed(0) + ")");
      r.style.opacity = fin > .02 ? 1 - smooth(.85, 1, fin) * .6 : 0;
    });

    // cards, chapters, progress bar
    cards.forEach(function (cd) { cd.classList.toggle("on", p >= +cd.dataset.in && p < +cd.dataset.out); });
    var ch = p < .2 ? 0 : p < .45 ? 1 : p < .62 ? 2 : p < .9 ? 3 : 4;
    chapters.forEach(function (b, i) { b.classList.toggle("on", i === ch); });
    document.querySelector(".bar i").style.transform = "scaleX(" + p.toFixed(4) + ")";
  }

  /* ---------- go ---------- */
  build(); cache(); resize();
  var ticking = false;
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }, { passive: true });
  window.addEventListener("resize", resize);
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      var max = scroller.offsetHeight - window.innerHeight;
      var smoothOk = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: +b.dataset.go * max, behavior: smoothOk ? "smooth" : "auto" });
    });
  });
  if (document.fonts) document.fonts.ready.then(function () { update(true); });
})();
