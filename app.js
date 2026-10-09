// ==========================================
// 1. TETAPAN
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbwF4UspQR4eL2KLay8LaCAswwIHdr3rzm2z3gSn0S4pLVPdujdMhYbTL7mtpnBTM7WCGw/exec";

const COUPLE = { a: "Shamin", b: "Azri", date: "24 October 2026", i1: "S", i2: "A" };

// Gambar pengantin (dalam folder assets/)
const COUPLE_PHOTO = "assets/Bride.jpeg";
const PHOTO_FILTER = "grayscale(0.9) sepia(0.15) contrast(1.05)";

// Saiz output gambar (nisbah 3:4)
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1440;
const JPEG_QUALITY = 0.85;

const CUSTOM_FRAMES = {};

// DOM Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('photoCanvas');
const frameCanvas = document.getElementById('frameCanvas');
const snapBtn = document.getElementById('snapBtn');
const guestNameInput = document.getElementById('guestName');
const bgMusic = document.getElementById('bgMusic');
const albumContainer = document.getElementById('albumContainer');
const uploadStatus = document.getElementById('uploadStatus');

let cameraStream = null;
let currentFacing = "environment";
let isMirrored = false;
let isUploading = false;
let currentFrame = "emas";

// ==========================================
// 2. LUKISAN SVG (BUNGA, DAUN, HIASAN)
// ==========================================
let uidCounter = 0;
const uid = p => `${p}${++uidCounter}`;

const DEFS = `
  <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fbf5eb"/><stop offset=".3" stop-color="#ebd398"/>
    <stop offset=".65" stop-color="#dfba78"/><stop offset="1" stop-color="#987332"/>
  </linearGradient>
  <radialGradient id="pRoseO" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#d9808f"/><stop offset="1" stop-color="#f6cdd3"/></radialGradient>
  <radialGradient id="pRoseM" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#bd3a56"/><stop offset="1" stop-color="#e08c9b"/></radialGradient>
  <radialGradient id="pRoseI" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#912741"/><stop offset="1" stop-color="#c75a70"/></radialGradient>
  <radialGradient id="pBlush" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#eab2b9"/><stop offset="1" stop-color="#fdeceb"/></radialGradient>
  <radialGradient id="pCream" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#e6d9c0"/><stop offset="1" stop-color="#fffaf1"/></radialGradient>
  <linearGradient id="gLeaf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5d7745"/><stop offset="1" stop-color="#93aa72"/></linearGradient>
  <linearGradient id="gLeafL" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7e9a62"/><stop offset="1" stop-color="#bfd0a3"/></linearGradient>
  <linearGradient id="gEnv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f2e6"/><stop offset="1" stop-color="#ddd2bc"/></linearGradient>
  <radialGradient id="gBg" cx=".5" cy=".4" r=".85"><stop offset="0" stop-color="#3b4e33"/><stop offset="1" stop-color="#121c11"/></radialGradient>
  <radialGradient id="gGreen" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#3b4e33"/><stop offset="1" stop-color="#1b281a"/></radialGradient>
  <radialGradient id="gWax" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d9506a"/><stop offset="1" stop-color="#8e2640"/></radialGradient>
  <radialGradient id="gDisc" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#151515"/></radialGradient>
  <linearGradient id="gShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121c11" stop-opacity="0"/><stop offset="1" stop-color="#121c11" stop-opacity=".88"/></linearGradient>
`;

function roseG(x, y, s = 1, tone = "rose") {
  const tones = {
    rose: ["pRoseO", "pRoseM", "pRoseI"],
    blush: ["pBlush", "pRoseO", "pRoseM"],
    cream: ["pCream", "pBlush", "pRoseO"]
  };
  const [o, m, i] = tones[tone];
  const ring = (n, r, pr, fill, off) => Array.from({ length: n }, (_, k) =>
    `<ellipse cx="0" cy="${-r}" rx="${pr * 0.85}" ry="${pr}" transform="rotate(${k * 360 / n + off})" fill="url(#${fill})" stroke="#7a2236" stroke-opacity=".18" stroke-width=".8"/>`
  ).join("");
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="3" cy="5" r="50" fill="#000" opacity=".12"/>
    ${ring(8, 30, 24, o, 0)}${ring(6, 19, 18, m, 15)}${ring(5, 9, 12, i, 30)}
    <circle r="5" fill="url(#${i})"/>
  </g>`;
}

function orchidG(x, y, s = 1, r = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <g stroke="#cdb994" stroke-opacity=".45" stroke-width=".8">
      <ellipse cx="0" cy="-26" rx="13" ry="24" fill="url(#pCream)"/>
      <ellipse cx="-20" cy="-12" rx="22" ry="26" transform="rotate(-28 -20 -12)" fill="url(#pCream)"/>
      <ellipse cx="20" cy="-12" rx="22" ry="26" transform="rotate(28 20 -12)" fill="url(#pCream)"/>
      <ellipse cx="-14" cy="16" rx="12" ry="22" transform="rotate(32 -14 16)" fill="url(#pCream)"/>
      <ellipse cx="14" cy="16" rx="12" ry="22" transform="rotate(-32 14 16)" fill="url(#pCream)"/>
    </g>
    <ellipse cx="0" cy="4" rx="7" ry="10" fill="url(#pBlush)"/>
    <circle cx="0" cy="-2" r="3.5" fill="#dfba78"/>
  </g>`;
}

function sprigG(x, y, len = 120, r = 0, flip = 1) {
  const n = Math.max(4, Math.round(len / 17));
  let out = `<path d="M0 0 Q${len / 2} ${-10 * flip} ${len} ${-2 * flip}" fill="none" stroke="#5d7745" stroke-width="2.2" stroke-linecap="round"/>`;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const px = (t * len).toFixed(1);
    const py = -flip * 8 * Math.sin(Math.PI * t);
    const size = 15 - 7 * t;
    const upY = (py - size * 0.75).toFixed(1);
    const dnY = (py + size * 0.75).toFixed(1);
    out += `<ellipse cx="${px}" cy="${upY}" rx="${size.toFixed(1)}" ry="${(size * 0.6).toFixed(1)}" transform="rotate(-38 ${px} ${upY})" fill="url(#${i % 2 ? "gLeaf" : "gLeafL"})"/>`;
    out += `<ellipse cx="${px}" cy="${dnY}" rx="${size.toFixed(1)}" ry="${(size * 0.6).toFixed(1)}" transform="rotate(38 ${px} ${dnY})" fill="url(#${i % 2 ? "gLeafL" : "gLeaf"})"/>`;
  }
  out += `<ellipse cx="${len + 6}" cy="${-2 * flip}" rx="8" ry="5" fill="url(#gLeaf)"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${r})">${out}</g>`;
}

function budsG() {
  return `
    <circle cx="-62" cy="-10" r="5" fill="#f1c9cc"/><circle cx="-70" cy="4" r="3.5" fill="#dfba78"/>
    <circle cx="58" cy="-6" r="4.5" fill="#f1c9cc"/><circle cx="66" cy="10" r="3" fill="#dfba78"/>
    <circle cx="8" cy="64" r="4" fill="#f1c9cc"/><circle cx="-18" cy="70" r="3" fill="#dfba78"/>`;
}

function bunchG() {
  return `
    ${sprigG(0, 0, 120, -160)}${sprigG(0, 0, 110, -105, -1)}${sprigG(0, 0, 125, -40)}
    ${sprigG(0, 0, 105, 25, -1)}${sprigG(0, 0, 90, 90)}
    ${orchidG(-34, 18, 0.85, -20)}${orchidG(38, 26, 0.7, 25)}
    ${roseG(0, 0, 0.95, "rose")}${roseG(40, -30, 0.55, "blush")}${roseG(-38, -34, 0.5, "rose")}
    ${orchidG(14, -52, 0.5, 10)}
    ${budsG()}`;
}

function placeBunch(x, y, s, r = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${bunchG()}</g>`;
}

function envelopeSceneSVG() {
  const HEART = "M180 175 C95 120 70 70 95 40 C118 14 160 22 180 58 C200 22 242 14 265 40 C290 70 265 120 180 175Z";
  return `<svg viewBox="0 0 360 330" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="180" cy="314" rx="150" ry="9" fill="#000" opacity=".25"/>
    <path d="M30 150 L180 52 L330 150Z" fill="#d3c8ae"/>
    <rect x="30" y="150" width="300" height="150" fill="#b9ac90"/>
    <path d="${HEART}" fill="#f3ead9" stroke="#f3ead9" stroke-width="22" stroke-linejoin="round" stroke-dasharray="0 16" stroke-linecap="round"/>
    <path d="${HEART}" fill="#f6eee0" stroke="#e8dcc4" stroke-width="2"/>
    <path d="${HEART}" transform="translate(180 100) scale(.8) translate(-180 -100)" fill="none" stroke="#e1d3b8" stroke-width="1.6" stroke-dasharray="2 5"/>
    <g transform="translate(224 206) rotate(9)">
      <rect x="-52" y="-102" width="108" height="132" fill="#000" opacity=".22"/>
      <rect x="-54" y="-104" width="108" height="132" fill="#fbf7ee" stroke="#e5dcc8"/>
      <rect x="-46" y="-96" width="92" height="98" fill="#cfc8b8"/>
      <image href="${COUPLE_PHOTO}" x="-46" y="-96" width="92" height="98" preserveAspectRatio="xMidYMid slice" style="filter:${PHOTO_FILTER}"/>
    </g>
    <path d="M30 150 L180 238 L30 300Z" fill="#ece3d0"/>
    <path d="M330 150 L180 238 L330 300Z" fill="#e4d9c2"/>
    <path d="M30 300 L180 205 L330 300Z" fill="url(#gEnv)"/>
    <path d="M30 150 L180 238 L330 150 M30 300 L180 205 L330 300" fill="none" stroke="#cfc3a8" stroke-width="1.2"/>
    <path d="M22 252 C80 240 120 258 160 244 C175 240 188 236 200 244 C240 256 290 242 338 250" fill="none" stroke="#c8a468" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 252 C80 240 120 258 160 244 C175 240 188 236 200 244 C240 256 290 242 338 250" fill="none" stroke="#ecd49c" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/>
    <path d="M165 244 C130 214 106 238 150 252 M178 242 C210 208 248 224 204 252" fill="none" stroke="#c8a468" stroke-width="5" stroke-linecap="round"/>
    <path d="M170 246 C165 270 150 282 142 290 M182 246 C190 270 206 280 214 288" fill="none" stroke="#c8a468" stroke-width="4" stroke-linecap="round"/>
    ${placeBunch(52, 172, 0.95, 5)}
    ${placeBunch(316, 212, 1.0, 190)}
    ${placeBunch(78, 74, 0.5, -20)}
  </svg>`;
}

function goldOvalSVG() {
  let beads = "";
  const N = 36;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    beads += `<circle cx="${(100 + 92 * Math.cos(a)).toFixed(1)}" cy="${(135 + 126 * Math.sin(a)).toFixed(1)}" r="2.7" fill="url(#gGold)"/>`;
  }
  return `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="100" cy="135" rx="80" ry="114" fill="url(#gGreen)"/>
    <ellipse cx="100" cy="135" rx="84" ry="118" fill="none" stroke="url(#gGold)" stroke-width="12"/>
    <ellipse cx="100" cy="135" rx="76" ry="110" fill="none" stroke="#8f6a2c" stroke-width="1.6"/>
    <ellipse cx="100" cy="135" rx="91" ry="125" fill="none" stroke="#8f6a2c" stroke-width="1"/>
    ${beads}
    <circle cx="100" cy="9" r="6" fill="url(#gGold)"/><circle cx="100" cy="261" r="6" fill="url(#gGold)"/>
    <circle cx="9" cy="135" r="6" fill="url(#gGold)"/><circle cx="191" cy="135" r="6" fill="url(#gGold)"/>
    <g style="filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.95));">
      <text x="100" y="80" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="48" font-weight="600" fill="#fffaf0">${COUPLE.a}</text>
      <text x="100" y="112" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="32" fill="#ebd398">&amp;</text>
      <text x="100" y="146" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="48" font-weight="600" fill="#fffaf0">${COUPLE.b}</text>
    </g>
  </svg>`;
}

function monogramSVG() {
  return `<svg viewBox="0 0 150 190" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="14" width="122" height="162" rx="8" fill="#f6eee0" stroke="#f6eee0" stroke-width="12" stroke-dasharray="0 9" stroke-linecap="round"/>
    <rect x="14" y="14" width="122" height="162" rx="8" fill="#f6eee0"/>
    <rect x="26" y="26" width="98" height="138" fill="none" stroke="#c9a35c" stroke-width="1.2"/>
    <rect x="30" y="30" width="90" height="130" fill="none" stroke="#c9a35c" stroke-width=".5"/>
    <text x="54" y="112" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="84" fill="url(#gGold)">${COUPLE.i1}</text>
    <text x="100" y="124" text-anchor="middle" font-family="'Great Vibes',cursive" font-size="84" fill="url(#gGold)" opacity=".92">${COUPLE.i2}</text>
    <text x="75" y="146" text-anchor="middle" font-family="'Cormorant Garamond',serif" font-size="8.5" letter-spacing="2.4" fill="#8a6a2c">WALIMATULURUS</text>
  </svg>`;
}

function stampSVG() {
  const m = uid("sm");
  let holes = "";
  for (let x = 6; x < 90; x += 10) holes += `<circle cx="${x}" cy="0" r="3.4" fill="#000"/><circle cx="${x}" cy="120" r="3.4" fill="#000"/>`;
  for (let y = 6; y < 120; y += 10) holes += `<circle cx="0" cy="${y}" r="3.4" fill="#000"/><circle cx="90" cy="${y}" r="3.4" fill="#000"/>`;
  return `<svg viewBox="0 0 90 120" xmlns="http://www.w3.org/2000/svg">
    <defs><mask id="${m}"><rect width="90" height="120" fill="#fff"/>${holes}</mask></defs>
    <g mask="url(#${m})">
      <rect width="90" height="120" fill="#f6efe2"/>
      <rect x="8" y="8" width="74" height="104" fill="#cfc8b8"/>
      <image href="${COUPLE_PHOTO}" x="8" y="8" width="74" height="104" preserveAspectRatio="xMidYMid slice" style="filter:${PHOTO_FILTER}"/>
    </g>
  </svg>`;
}

function sealEnvelopeSVG() {
  return `<svg viewBox="0 0 120 86" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="112" height="74" fill="url(#gEnv)" stroke="#d3c7ad"/>
    <path d="M4 6 L60 50 L116 6" fill="#efe6d3" stroke="#d3c7ad"/>
    <path d="M4 80 L48 42 M116 80 L72 42" fill="none" stroke="#d3c7ad"/>
    <circle cx="60" cy="48" r="14" fill="url(#gWax)"/>
    <circle cx="60" cy="48" r="10.5" fill="none" stroke="#fff" stroke-opacity=".25"/>
    <path d="M60 44 C55 37 47 46 60 55 C73 46 65 37 60 44Z" fill="#f5e3d8" opacity=".92"/>
  </svg>`;
}

function discSVG() {
  const pid = uid("dp");
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs><path id="${pid}" d="M100 174 a74 74 0 1 1 0 -148 a74 74 0 1 1 0 148"/></defs>
    <g class="rec">
      <circle cx="100" cy="100" r="98" fill="url(#gDisc)"/>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#fff" stroke-opacity=".08"/>
      <circle cx="100" cy="100" r="86" fill="none" stroke="#fff" stroke-opacity=".06"/>
      <circle cx="100" cy="100" r="58" fill="none" stroke="#fff" stroke-opacity=".06"/>
      <text class="disc-text" text-anchor="middle" font-family="'Cormorant Garamond',serif" font-size="17" letter-spacing="2.2" fill="#ebd398">
        <textPath href="#${pid}" startOffset="50%">Klik untuk mainkan lagu</textPath>
      </text>
      <circle cx="100" cy="100" r="46" fill="url(#gGold)"/>
      <circle cx="100" cy="100" r="40" fill="none" stroke="#8f6a2c" stroke-width="1"/>
    </g>
    <g class="ic-play"><path d="M92 82 L121 100 L92 118Z" fill="#2b2112"/></g>
    <g class="ic-pause"><rect x="88" y="84" width="9" height="32" rx="2" fill="#2b2112"/><rect x="103" y="84" width="9" height="32" rx="2" fill="#2b2112"/></g>
  </svg>`;
}

const ART = {
  envelope: envelopeSceneSVG,
  oval: goldOvalSVG,
  monogram: monogramSVG,
  stamp: stampSVG,
  seal: sealEnvelopeSVG,
  disc: discSVG,
  bunch: () => `<svg viewBox="-110 -110 220 220" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">${bunchG()}</svg>`
};

function buildArt() {
  const holder = document.createElement('div');
  holder.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${DEFS}</defs></svg>`;
  document.body.prepend(holder.firstChild);

  document.querySelectorAll('[data-art]').forEach(el => {
    const fn = ART[el.dataset.art];
    if (fn) el.innerHTML = fn();
  });
}

// ==========================================
// 3. BINGKAI (FRAME)
// ==========================================
function frameSVG(key) {
  let body = "";

  if (key === "emas") {
    const oval = "M170 610a370 500 0 1 0 740 0a370 500 0 1 0 -740 0Z";
    let beads = "";
    const N = 60;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      beads += `<circle cx="${(540 + 408 * Math.cos(a)).toFixed(1)}" cy="${(610 + 538 * Math.sin(a)).toFixed(1)}" r="7" fill="url(#gGold)"/>`;
    }
    body = `
      <path fill-rule="evenodd" fill="url(#gBg)" d="M0 0H1080V1440H0Z ${oval}"/>
      <ellipse cx="540" cy="610" rx="372" ry="502" fill="none" stroke="url(#gGold)" stroke-width="30"/>
      <ellipse cx="540" cy="610" rx="352" ry="482" fill="none" stroke="#8f6a2c" stroke-width="3"/>
      <ellipse cx="540" cy="610" rx="392" ry="522" fill="none" stroke="url(#gGold)" stroke-width="4"/>
      ${beads}
      ${placeBunch(915, 200, 1.45, 10)}
      ${placeBunch(165, 1010, 1.45, 190)}
      ${placeBunch(150, 215, 0.7, -30)}
      ${placeBunch(940, 1050, 0.7, 150)}
    `;
  }

  if (key === "renda") {
    const arch = "M150 1130V540A390 390 0 0 1 930 540V1130Z";
    body = `
      <path fill-rule="evenodd" fill="url(#gBg)" d="M0 0H1080V1440H0Z ${arch}"/>
      <path d="M118 1162V540A422 422 0 0 1 962 540V1162Z" fill="none" stroke="#f4ecdc" stroke-width="14" stroke-dasharray="0 22" stroke-linecap="round"/>
      <path d="M134 1146V540A406 406 0 0 1 946 540V1146Z" fill="none" stroke="#f4ecdc" stroke-width="6" stroke-dasharray="0 14" stroke-linecap="round" opacity=".8"/>
      <path d="${arch}" fill="none" stroke="#f4ecdc" stroke-width="36"/>
      <path d="${arch}" fill="none" stroke="url(#gGold)" stroke-width="4"/>
      ${placeBunch(150, 1130, 1.1, 200)}
      ${placeBunch(940, 1130, 1.1, -20)}
      ${placeBunch(110, 190, 0.75, -40)}
      ${placeBunch(970, 190, 0.75, 40)}
    `;
  }

  if (key === "polaroid") {
    body = `
      <path fill-rule="evenodd" fill="#f7f1e6" d="M0 0H1080V1440H0Z M60 60H1020V1140H60Z"/>
      <rect x="2" y="2" width="1076" height="1436" fill="none" stroke="#e5dcc8" stroke-width="4"/>
      <rect x="60" y="60" width="960" height="1080" fill="none" stroke="#e8dfca" stroke-width="3"/>
      ${placeBunch(120, 1290, 0.55, 190)}
      ${placeBunch(960, 1290, 0.55, -10)}
    `;
  }

  if (key === "asli") {
    body = `
      <rect x="0" y="1060" width="1080" height="380" fill="url(#gShade)"/>
      <rect x="30" y="30" width="1020" height="1380" fill="none" stroke="url(#gGold)" stroke-width="3"/>
      <rect x="48" y="48" width="984" height="1344" fill="none" stroke="#dfba78" stroke-width="1" opacity=".6"/>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"><defs>${DEFS}</defs>${body}</svg>`;
}

const FRAME_TEXT = {
  emas:     { size: 150, nameY: 1292, dateY: 1372, gold: true },
  renda:    { size: 150, nameY: 1305, dateY: 1385, gold: true },
  polaroid: { size: 138, nameY: 1262, dateY: 1342, nameColor: "#3d5133", dateColor: "#8e2640" },
  asli:     { size: 120, nameY: 1325, dateY: 1390, nameColor: "#fbf5eb", dateColor: "#ebd398" }
};

const frameImgCache = {};
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadFrameImage(key) {
  if (!frameImgCache[key]) {
    const src = CUSTOM_FRAMES[key] || ("data:image/svg+xml;charset=utf-8," + encodeURIComponent(frameSVG(key)));
    frameImgCache[key] = await loadImage(src);
  }
  return frameImgCache[key];
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load("120px 'Great Vibes'"),
      document.fonts.load("500 32px 'Cormorant Garamond'")
    ]);
  } catch (e) { /* fallback font */ }
}

function drawSpaced(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map(c => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

function drawFrameText(ctx, key) {
  const t = FRAME_TEXT[key];
  if (!t) return;

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  if (t.gold) {
    const g = ctx.createLinearGradient(240, 0, 840, 0);
    g.addColorStop(0, "#fbf5eb");
    g.addColorStop(0.4, "#dfba78");
    g.addColorStop(0.7, "#987332");
    g.addColorStop(1, "#ebd398");
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = t.nameColor;
  }
  ctx.font = `${t.size}px 'Great Vibes', 'Brush Script MT', cursive`;
  ctx.fillText(`${COUPLE.a} & ${COUPLE.b}`, OUTPUT_WIDTH / 2, t.nameY);

  ctx.fillStyle = t.gold ? "#ebd398" : t.dateColor;
  ctx.font = "500 34px 'Cormorant Garamond', Georgia, serif";
  drawSpaced(ctx, COUPLE.date.toUpperCase(), OUTPUT_WIDTH / 2, t.dateY, 9);

  ctx.restore();
}

function paintFrame(ctx, key, img) {
  ctx.drawImage(img, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  if (!CUSTOM_FRAMES[key]) drawFrameText(ctx, key);
}

let frameToken = 0;
async function changeFrame(key) {
  currentFrame = key;
  document.querySelectorAll('.frame-options button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.frame === key);
  });

  const token = ++frameToken;
  await ensureFonts();
  let img;
  try {
    img = await loadFrameImage(key);
  } catch (err) {
    console.warn("Bingkai gagal dimuatkan:", err);
    return;
  }
  if (token !== frameToken || !frameCanvas) return;

  const ctx = frameCanvas.getContext('2d');
  ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  paintFrame(ctx, key, img);
}

// ==========================================
// 4. NAVIGASI HALAMAN
// ==========================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.body.dataset.page = id;
  window.scrollTo(0, 0);
}

function goToPage1() {
  showPage('page1');
  stopCamera();
}

function goToPage2() {
  showPage('page2');
  stopCamera();
  if (bgMusic && bgMusic.paused && !musicStopped) {
    bgMusic.play().catch(err => console.log("Auto-play disekat:", err));
  }
}

function goToPage3() {
  showPage('page3');
  initCamera();
}

function goToPage4() {
  showPage('page4');
  stopCamera();
  loadAlbum();
}

// ==========================================
// 5. MUZIK
// ==========================================
let musicStopped = false;

function syncMusicButtons() {
  const playing = bgMusic && !bgMusic.paused;
  document.querySelectorAll('.music-btn').forEach(b => b.classList.toggle('playing', playing));
}

function toggleMusic() {
  if (!bgMusic) return;
  if (bgMusic.paused) {
    musicStopped = false;
    bgMusic.play().catch(err => {
      console.log("Lagu tak dapat dimainkan:", err);
      toast("Fail lagu tidak dijumpai 🎵");
    });
  } else {
    musicStopped = true;
    bgMusic.pause();
  }
}

if (bgMusic) {
  bgMusic.addEventListener('play', syncMusicButtons);
  bgMusic.addEventListener('pause', syncMusicButtons);
}

// ==========================================
// 6. TOAST & FLASH
// ==========================================
let toastTimer = null;
function toast(msg, ms = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function doFlash() {
  const f = document.getElementById('flash');
  if (!f) return;
  f.classList.remove('go');
  void f.offsetWidth;
  f.classList.add('go');
}

// ==========================================
// 7. KAMERA
// ==========================================
async function initCamera() {
  stopCamera();
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: currentFacing },
        width: { ideal: 1280 },
        height: { ideal: 1920 }
      },
      audio: false
    });

    const settings = cameraStream.getVideoTracks()[0].getSettings();
    isMirrored = settings.facingMode ? settings.facingMode === "user" : true;

    if (video) {
      video.classList.toggle('mirror', isMirrored);
      video.srcObject = cameraStream;
    }
  } catch (err) {
    console.error("Camera Access Error:", err);
    toast("Sila benarkan akses kamera untuk mengambil gambar 📷", 4000);
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (video) video.srcObject = null;
}

function flipCamera() {
  currentFacing = currentFacing === "environment" ? "user" : "environment";
  initCamera();
}

// ==========================================
// 8. TANGKAP GAMBAR & MUAT NAIK
// ==========================================
async function capturePhoto() {
  if (isUploading) return;
  if (!video || !video.srcObject || !video.videoWidth) {
    toast("Kamera belum bersedia, cuba sebentar lagi");
    return;
  }

  doFlash();

  const ctx = canvas.getContext('2d');
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;
  let sx = 0, sy = 0, sw = vw, sh = vh;

  if (vw / vh > targetRatio) {
    sw = vh * targetRatio;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / targetRatio;
    sy = (vh - sh) / 2;
  }

  ctx.save();
  if (isMirrored) {
    ctx.translate(OUTPUT_WIDTH, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  ctx.restore();

  try {
    await ensureFonts();
    const frameImg = await loadFrameImage(currentFrame);
    paintFrame(ctx, currentFrame, frameImg);
  } catch (err) {
    console.warn("Bingkai gagal dimuatkan, gambar disimpan tanpa bingkai.", err);
  }

  const imageBase64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  uploadPhoto(imageBase64);
}

if (snapBtn) snapBtn.addEventListener('click', capturePhoto);

function setUploading(state) {
  isUploading = state;
  if (snapBtn) {
    snapBtn.disabled = state;
    snapBtn.style.opacity = state ? "0.5" : "1";
  }
  if (uploadStatus) uploadStatus.textContent = state ? "Sedang menghantar gambar..." : "";
}

// LocalStorage helper untuk kesan gambar kepunyaan pengguna di peranti ini
function getMyPhotos() {
  try {
    return JSON.parse(localStorage.getItem('my_wedding_photos') || '[]');
  } catch (e) {
    return [];
  }
}

function saveMyPhoto(photoRef) {
  if (!photoRef) return;
  const list = getMyPhotos();
  if (!list.includes(photoRef)) {
    list.push(photoRef);
    localStorage.setItem('my_wedding_photos', JSON.stringify(list));
  }
}

function removeMyPhoto(photoRef) {
  if (!photoRef) return;
  let list = getMyPhotos();
  list = list.filter(item => item !== photoRef);
  localStorage.setItem('my_wedding_photos', JSON.stringify(list));
}

function isMyPhoto(fileObj) {
  if (!fileObj) return false;
  const list = getMyPhotos();
  if (typeof fileObj === 'string') return list.includes(fileObj);
  const id = fileObj.id || fileObj.fileId || fileObj.url;
  const url = fileObj.url;
  return (id && list.includes(id)) || (url && list.includes(url));
}

async function uploadPhoto(base64Data) {
  setUploading(true);

  const name = guestNameInput && guestNameInput.value.trim() !== ""
    ? guestNameInput.value.trim()
    : "Tetamu";

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ image: base64Data, guestName: name })
    });

    const result = await response.json();

    if (result.status === "success") {
      const photoRef = result.fileId || result.id || result.url || base64Data.slice(0, 80);
      saveMyPhoto(photoRef);
      if (result.url) saveMyPhoto(result.url);

      goToPage4();
      toast("Gambar berjaya disimpan ke album 💕");
    } else {
      toast("Ralat muat naik: " + (result.message || "tidak diketahui"), 4000);
    }
  } catch (err) {
    console.error("Upload Error:", err);
    toast("Gagal menghantar gambar. Semak internet dan cuba lagi.", 4000);
  } finally {
    setUploading(false);
  }
}

// ==========================================
// 9. ALBUM DARI GOOGLE DRIVE & VIEWER MODAL
// ==========================================
let currentViewerUrl = "";
let currentViewerFileObj = null;

function openViewer(url, name, fileObj) {
  currentViewerUrl = url;
  currentViewerFileObj = fileObj || url;

  const viewer = document.getElementById('viewer');
  const viewerImg = document.getElementById('viewerImg');
  const viewerName = document.getElementById('viewerName');
  const saveBtn = document.getElementById('saveBtn');
  const saveBtnLabel = document.getElementById('saveBtnLabel');
  const deleteBtn = document.getElementById('deleteBtn');

  if (!viewer || !viewerImg) return;

  viewerImg.src = url;
  if (viewerName) viewerName.textContent = name || "Tetamu";
  
  if (saveBtn) saveBtn.disabled = false;
  if (saveBtnLabel) saveBtnLabel.textContent = "SIMPAN GAMBAR";

  // Paparkan butang padam hanya jika gambar ini milik peranti pengguna ini
  const isMine = isMyPhoto(fileObj) || isMyPhoto(url);
  if (deleteBtn) deleteBtn.style.display = isMine ? "flex" : "none";

  viewer.classList.add('open');
}

function closeViewer() {
  const viewer = document.getElementById('viewer');
  if (viewer) viewer.classList.remove('open');
}

function saveToGallery() {
  if (!currentViewerUrl) return;
  const a = document.createElement('a');
  a.href = currentViewerUrl;
  a.download = `Wedding-Shamin-Azri-${Date.now()}.jpg`;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast("Gambar mula dimuat turun 📥");
}

async function deletePhoto(fileObj, fileUrl) {
  if (!confirm("Adakah anda pasti mahu memadam gambar ini dari album?")) return;

  toast("Sedang memadam gambar...");
  const fileRef = typeof fileObj === 'string' ? fileObj : (fileObj ? (fileObj.id || fileObj.fileId || fileObj.url) : fileUrl);

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "delete", fileId: fileRef, url: fileUrl || fileRef })
    });

    const result = await response.json();
    if (result && result.status === "success") {
      removeMyPhoto(fileRef);
      if (fileUrl) removeMyPhoto(fileUrl);
      closeViewer();
      toast("Gambar anda berjaya dipadam 🗑️");
      loadAlbum();
    } else {
      removeMyPhoto(fileRef);
      if (fileUrl) removeMyPhoto(fileUrl);
      closeViewer();
      toast("Gambar dipadam dari album peranti anda 🗑️");
      loadAlbum();
    }
  } catch (err) {
    console.error("Delete Error:", err);
    removeMyPhoto(fileRef);
    if (fileUrl) removeMyPhoto(fileUrl);
    closeViewer();
    toast("Gambar dipadam dari album peranti anda 🗑️");
    loadAlbum();
  }
}

function deleteCurrentViewerPhoto() {
  if (currentViewerFileObj || currentViewerUrl) {
    deletePhoto(currentViewerFileObj, currentViewerUrl);
  }
}

function showAlbumMessage(text, withIcon = true) {
  albumContainer.innerHTML = "";
  const box = document.createElement('div');
  box.className = 'empty-state';
  if (withIcon) {
    const icon = document.createElement('div');
    icon.className = 'envelope-icon';
    icon.innerHTML = sealEnvelopeSVG();
    box.appendChild(icon);
  }
  const p = document.createElement('p');
  p.textContent = text;
  box.appendChild(p);
  albumContainer.appendChild(box);
}

async function loadAlbum() {
  if (!albumContainer) return;
  showAlbumMessage("Memuat turun gambar kenangan...");

  try {
    const response = await fetch(GAS_URL);
    const result = await response.json();

    if (result.status === "success" && result.files && result.files.length > 0) {
      albumContainer.innerHTML = "";

      result.files.forEach((file, idx) => {
        const card = document.createElement('figure');
        card.className = 'album-item';
        card.style.animationDelay = `${idx * 0.08}s`;

        const img = document.createElement('img');
        img.src = file.url;
        img.alt = "Kenangan majlis";
        img.loading = "lazy";

        const cap = document.createElement('figcaption');
        cap.textContent = file.guestName || "Tetamu";

        card.appendChild(img);
        card.appendChild(cap);

        // Jika gambar ini diambil oleh peranti/pengguna ini, tambah ikon tong sampah (padam)
        if (isMyPhoto(file) || isMyPhoto(file.url)) {
          const delBtn = document.createElement('button');
          delBtn.className = 'delete-photo-btn';
          delBtn.ariaLabel = "Padam gambar ini";
          delBtn.title = "Padam gambar anda";
          delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
          delBtn.onclick = (e) => {
            e.stopPropagation();
            deletePhoto(file, file.url);
          };
          card.appendChild(delBtn);
        }

        card.onclick = () => openViewer(file.url, file.guestName || "Tetamu", file);

        albumContainer.appendChild(card);
      });
    } else {
      showAlbumMessage("Belum ada gambar — jadilah yang pertama!");
    }
  } catch (err) {
    console.error("Error loading album:", err);
    showAlbumMessage("Gagal memuat turun album. Sila tekan butang muat semula (↻).", false);
  }
}

// ==========================================
// 10. ANIMASI PARTICLES & PETALS (AESTHETIC FX)
// ==========================================
function initBgParticles() {
  const bgCanvas = document.getElementById('bgCanvas');
  if (!bgCanvas) return;
  const ctx = bgCanvas.getContext('2d');

  let width = (bgCanvas.width = window.innerWidth);
  let height = (bgCanvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = bgCanvas.width = window.innerWidth;
    height = bgCanvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(35, Math.floor(width / 20));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1.2,
      speedY: Math.random() * 0.5 + 0.15,
      speedX: Math.sin(Math.random() * Math.PI * 2) * 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * 0.02 + 0.005,
      isPetal: i % 3 === 0,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.02
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.y -= p.speedY;
      p.x += Math.sin(p.y * 0.01) * 0.4 + p.speedX;
      p.angle += p.angularSpeed;

      if (p.y < -20) {
        p.y = height + 20;
        p.x = Math.random() * width;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      if (p.isPetal) {
        // Lukis kelopak bunga rose lembut
        ctx.fillStyle = `rgba(235, 180, 190, ${p.opacity * 0.75})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 2.2, p.size * 3.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Lukis habuk emas bersinar (gold dust sparkle)
        ctx.fillStyle = `rgba(235, 211, 152, ${p.opacity})`;
        ctx.shadowColor = "rgba(223, 186, 120, 0.8)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  render();
}

// Sparkle Burst pada Sentuhan / Klik
window.addEventListener('pointerdown', (e) => {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      width: 6px;
      height: 6px;
      background: radial-gradient(circle, #fff, #dfba78);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 10px #dfba78;
      transition: transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s ease;
    `;
    document.body.appendChild(star);

    const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4);
    const dist = Math.random() * 35 + 20;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    requestAnimationFrame(() => {
      star.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
      star.style.opacity = '0';
    });

    setTimeout(() => star.remove(), 600);
  }
});

// ==========================================
// 11. MULA
// ==========================================
buildArt();
changeFrame(currentFrame);
initBgParticles();