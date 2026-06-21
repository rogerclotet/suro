// Generates the HTML for a 10-slide Catalan Instagram carousel for Suro.
// Brand: "suro" = cork (Catalan) → a shared corkboard. Cream paper-grain
// background, white cards pinned with cork pushpins, sage-green type, Convergence.
// Copy is verbatim from apps/web/src/i18n/messages/ca.json (landing section).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const OUT = HERE;

const b64 = (p) => readFileSync(p).toString("base64");
const dataUri = (mime, p) => `data:${mime};base64,${b64(p)}`;

const fontLatin = b64(
  `${REPO}/node_modules/.pnpm/@fontsource+convergence@5.2.8/node_modules/@fontsource/convergence/files/convergence-latin-400-normal.woff2`,
);
const fontLatinExt = b64(
  `${REPO}/node_modules/.pnpm/@fontsource+convergence@5.2.8/node_modules/@fontsource/convergence/files/convergence-latin-ext-400-normal.woff2`,
);
const logo = dataUri("image/png", `${REPO}/apps/web/public/logo.png`);
const googlePlay = dataUri(
  "image/png",
  `${REPO}/apps/web/public/badges/google-play.png`,
);
const appStore = dataUri(
  "image/svg+xml",
  `${REPO}/apps/web/public/badges/app-store.svg`,
);
const pdfIcon = dataUri("image/svg+xml", `${REPO}/apps/web/public/pdf.svg`);

// Subtle paper/cork grain as an inline SVG turbulence data URI.
const grain = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
);

const C = {
  cream: "#f6f2ea",
  cream2: "#efe8da",
  ink: "#1e1e2e",
  muted: "#6c6f85",
  green: "#4c7642",
  greenDeep: "#3c5f34",
  cork: "#c2a368",
  corkDeep: "#a9854e",
  border: "#e4ddd0",
  white: "#ffffff",
};

// --- Icons (lucide-style, 24x24, currentColor stroke) -----------------------
const I = {
  lists: `<rect x="3" y="4" width="6.4" height="6.4" rx="1.8"/><path d="M4.7 7.1l1.1 1.1 1.6-1.9"/><rect x="3" y="13.6" width="6.4" height="6.4" rx="1.8"/><path d="M4.7 16.7l1.1 1.1 1.6-1.9"/><path d="M13 6.2h8"/><path d="M13 9.2h5.2"/><path d="M13 16.4h8"/><path d="M13 19.4h5.2"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2.6"/><path d="M3 9.6h18"/><path d="M8 3v4"/><path d="M16 3v4"/><circle cx="8.4" cy="14" r="1.05" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1.05" fill="currentColor" stroke="none"/><circle cx="15.6" cy="14" r="1.05" fill="currentColor" stroke="none"/><circle cx="8.4" cy="17.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="12" cy="17.6" r="1.05" fill="currentColor" stroke="none"/>`,
  files: `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 16.5h6"/><path d="M9 9.7h2.2"/>`,
  expenses: `<circle cx="12" cy="12" r="8.6"/><path d="M15.4 8.8a4.3 4.3 0 1 0 0 6.4"/><path d="M7.7 11h5.6"/><path d="M7.7 13.2h4.6"/>`,
  gift: `<rect x="3.4" y="9.4" width="17.2" height="10.6" rx="2"/><path d="M3.4 13.6h17.2"/><path d="M12 9.4V20"/><path d="M12 9.4C12 9.4 10.6 4.8 8 4.8a2.3 2.3 0 0 0 0 4.6z"/><path d="M12 9.4C12 9.4 13.4 4.8 16 4.8a2.3 2.3 0 0 1 0 4.6z"/>`,
  bell: `<path d="M6.2 9.5a5.8 5.8 0 0 1 11.6 0c0 4.6 1.9 5.9 1.9 5.9H4.3s1.9-1.3 1.9-5.9z"/><path d="M10 19.2a2 2 0 0 0 4 0"/>`,
  home: `<path d="M3.6 11.2L12 4.6l8.4 6.6"/><path d="M5.6 9.8V19.4h12.8V9.8"/><path d="M9.6 19.4v-5.2h4.8v5.2"/>`,
  users: `<circle cx="9" cy="8.2" r="3.3"/><path d="M3.4 19.2c0-3.1 2.5-5.4 5.6-5.4s5.6 2.3 5.6 5.4"/><circle cx="17.4" cy="9.4" r="2.3"/><path d="M16.3 14c2.5.1 4.7 2 4.7 5"/>`,
  sparkles: `<path d="M11 3.6l1.7 4.6 4.6 1.7-4.6 1.7L11 16.2l-1.7-4.6L4.7 9.9l4.6-1.7z"/><path d="M18 14.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>`,
  link: `<path d="M10.4 13.6a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 1 0-5.66-5.66l-1.3 1.3"/><path d="M13.6 10.4a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 1 0 5.66 5.66l1.3-1.3"/>`,
  chevron: `<path d="M9 6l6 6-6 6"/>`,
  check: `<path d="M5 12.5l4 4 10-10"/>`,
};

const icon = (paths, size = 58, stroke = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

// --- UI mockup helpers (mirror the app's info-page demos) -------------------
// Catppuccin Latte avatar swatches, mapped to the demo members.
const CAT = {
  peach: "#fab387",
  teal: "#94e2d5",
  mauve: "#cba6f7",
  blue: "#89b4fa",
};

const avatar = (letter, bg, size = 56) =>
  `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:${C.ink};
    display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.46)}px;flex:0 0 auto;">${letter}</div>`;

// Amounts are stored in cents; balances show signed Catalan currency.
const euro = (cents) =>
  `${cents < 0 ? "−" : ""}${(Math.abs(cents) / 100).toFixed(2).replace(".", ",")} €`;

const checkbox = (done) =>
  done
    ? `<div style="width:36px;height:36px;border-radius:9px;background:${C.green};display:flex;align-items:center;justify-content:center;flex:0 0 auto;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${I.check}</svg></div>`
    : `<div style="width:36px;height:36px;border-radius:9px;border:3px solid ${C.green};box-sizing:border-box;flex:0 0 auto;"></div>`;

const checkItem = (name, done) =>
  `<div style="display:flex;align-items:center;gap:20px;padding:11px 2px;">
     ${checkbox(done)}
     <span style="font-size:31px;${done ? `color:${C.muted};text-decoration:line-through;` : `color:${C.ink};`}">${name}</span>
   </div>`;

const fileRow = (name, size, who) =>
  `<div style="display:flex;align-items:center;gap:18px;padding:14px 0;border-top:1px solid ${C.border};">
     <img src="${pdfIcon}" style="width:40px;height:40px;flex:0 0 auto;"/>
     <div style="display:flex;flex-direction:column;min-width:0;">
       <span style="font-size:28px;color:${C.ink};">${name}</span>
       <span style="font-size:22px;color:${C.muted};">${size}</span>
     </div>
     <span style="margin-left:auto;font-size:22px;color:${C.muted};white-space:nowrap;">Pujat per ${who}</span>
   </div>`;

const ideaRow = (txt) =>
  `<div style="display:flex;align-items:center;gap:18px;padding:11px 2px;">
     <span style="color:${C.green};display:inline-flex;">${icon(I.gift, 30, 2)}</span>
     <span style="font-size:30px;color:${C.ink};">${txt}</span>
   </div>`;

const notifRow = (letter, bg, html, time, first) =>
  `<div style="display:flex;align-items:flex-start;gap:18px;padding:18px 2px;${first ? "" : `border-top:1px solid ${C.border};`}">
     ${avatar(letter, bg, 54)}
     <div style="flex:1;">
       <div style="font-size:28px;line-height:1.35;color:${C.ink};">${html}</div>
       <div style="font-size:22px;color:${C.muted};margin-top:5px;">${time}</div>
     </div>
   </div>`;

const mockCard = (inner, pad = "34px 38px 38px") =>
  `<div style="position:relative;width:100%;background:${C.white};border:1px solid ${C.border};
     border-radius:32px;padding:${pad};box-shadow:0 30px 60px -28px rgba(60,40,18,.34),0 4px 0 0 ${C.cream2};">
     <div class="pin"></div>${inner}</div>`;

// Balance bars: green extends right (is owed), red extends left (owes), from centre.
const balances = [
  { name: "Marta", letter: "M", bg: CAT.peach, cents: 4500 },
  { name: "Joan", letter: "J", bg: CAT.teal, cents: -1070 },
  { name: "Laia", letter: "L", bg: CAT.mauve, cents: -2030 },
  { name: "Pau", letter: "P", bg: CAT.blue, cents: -1400 },
];
const MAX_ABS = Math.max(...balances.map((b) => Math.abs(b.cents)));
const BAR_W = 330;
const balanceRow = (b) => {
  const pos = b.cents >= 0;
  const w = Math.round((Math.abs(b.cents) / MAX_ABS) * (BAR_W / 2));
  const bar = pos
    ? `left:50%;width:${w}px;background:${C.green};`
    : `right:50%;width:${w}px;background:#e64553;`;
  return `<div style="display:flex;align-items:center;gap:22px;padding:15px 4px;border-top:1px solid ${C.border};">
     ${avatar(b.letter, b.bg, 58)}
     <span style="font-size:31px;color:${C.ink};">${b.name}</span>
     <div style="margin-left:auto;position:relative;width:${BAR_W}px;height:62px;border-radius:14px;background:${C.cream2};overflow:hidden;display:flex;align-items:center;justify-content:center;">
       <div style="position:absolute;top:0;bottom:0;${bar}"></div>
       <span style="position:relative;z-index:2;background:${C.ink};color:#fff;border-radius:999px;padding:7px 16px;font-size:26px;">${euro(b.cents)}</span>
     </div>
   </div>`;
};

const MOCKS = {
  lists: mockCard(`
    <div style="font-size:33px;color:${C.ink};">Cap de setmana a Sitges</div>
    <div style="display:flex;align-items:center;gap:16px;margin:18px 0 8px;">
      <div style="flex:1;height:9px;border-radius:99px;background:${C.cream2};overflow:hidden;"><div style="width:71%;height:100%;background:${C.green};border-radius:99px;"></div></div>
      <span style="font-size:24px;color:${C.muted};">5/7</span>
    </div>
    <div style="font-size:27px;color:${C.muted};margin:18px 2px 2px;">Roba</div>
    ${checkItem("Banyador", true)}
    ${checkItem("Jaqueta lleugera", false)}
    <div style="font-size:27px;color:${C.muted};margin:18px 2px 2px;">Lavabo</div>
    ${checkItem("Crema solar", true)}
    ${checkItem("Raspall de dents", false)}
  `),
  calendar: mockCard(`
    <div style="display:flex;align-items:flex-start;gap:20px;padding-bottom:24px;border-bottom:1px solid ${C.border};">
      <div class="chip" style="width:66px;height:66px;border-radius:16px;flex:0 0 auto;">${icon(I.calendar, 32)}</div>
      <div>
        <div style="font-size:33px;color:${C.ink};">Cap de setmana a Sitges</div>
        <div style="font-size:26px;color:${C.muted};margin-top:6px;">Divendres 12 de juny · 18:00</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:14px;padding:22px 2px 8px;">
      <span style="color:${C.green};display:inline-flex;transform:rotate(90deg);">${icon(I.chevron, 26, 2.4)}</span>
      <span style="color:${C.muted};display:inline-flex;">${icon(I.lists, 26)}</span>
      <span style="font-size:28px;color:${C.ink};">Llista enllaçada</span>
      <span style="margin-left:auto;font-size:24px;color:${C.muted};">3/4</span>
    </div>
    <div style="padding-left:6px;">
      ${checkItem("Banyador", true)}
      ${checkItem("Bitllet de tren", false)}
    </div>
  `),
  files: mockCard(`
    <div style="font-size:31px;color:${C.ink};">Normes de la casa</div>
    <div style="font-size:26px;line-height:1.45;color:${C.muted};margin-top:10px;">
      <span style="color:${C.ink};">Torn de neteja.</span> La Marta fa la cuina les setmanes 1 i 3; en Joan, el bany les 2 i 4.
    </div>
    <div style="font-size:22px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};margin:28px 0 2px;">Fitxers del grup</div>
    ${fileRow("Contracte de lloguer.pdf", "482 KB", "Marta")}
    ${fileRow("Manual de la caldera.pdf", "1,24 MB", "Laia")}
  `),
  expenses: mockCard(`
    <div style="display:flex;align-items:center;padding:0 4px 14px;border-bottom:1px solid ${C.border};">
      <span style="font-size:22px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Membre</span>
      <span style="margin-left:auto;width:${BAR_W}px;text-align:center;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};">Saldo</span>
    </div>
    ${balances.map(balanceRow).join("")}
  `),
  santa: mockCard(`
    <div style="text-align:center;">
      <div style="font-size:22px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">Amic invisible · Nadal</div>
      <div style="font-size:29px;color:${C.ink};margin-top:16px;">Et toca regalar a…</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:16px 0 4px;">
        ${avatar("L", CAT.mauve, 76)}<span style="font-size:44px;color:${C.green};">Laia</span>
      </div>
    </div>
    <div style="border-top:1px solid ${C.border};margin-top:24px;padding-top:18px;">
      <div style="font-size:22px;letter-spacing:1px;text-transform:uppercase;color:${C.muted};margin-bottom:6px;">Les seves idees</div>
      ${ideaRow("Llibre de cuina italiana")}
      ${ideaRow("Planta per a l'escriptori")}
      ${ideaRow("Auriculars sense fil")}
    </div>
  `),
  notif: mockCard(`
    ${notifRow("M", CAT.peach, `La Marta ha afegit <span style="color:${C.green};">«Crema solar»</span> a Equipatge`, "ara", true)}
    ${notifRow("J", CAT.teal, `En Joan t'ha saldat <span style="color:${C.green};">10,70 €</span>`, "fa 2 h", false)}
    ${notifRow("L", CAT.mauve, `La Laia ha creat l'esdeveniment <span style="color:${C.green};">«Sopar de Nadal»</span>`, "ahir", false)}
  `),
};

const featureSlide = ({ n, icon: ic, title, body, mock }) =>
  page(`
  <div class="pad">
    ${header(n)}
    <div style="display:flex;align-items:center;gap:26px;margin-top:30px;">
      <div class="chip" style="width:96px;height:96px;border-radius:24px;flex:0 0 auto;">${icon(ic, 50)}</div>
      <h2 style="font-size:52px;line-height:1.04;color:${C.green};">${title}</h2>
    </div>
    <p style="font-size:31px;line-height:1.42;color:${C.muted};margin-top:22px;max-width:900px;">${body}</p>
    <div style="flex:1;display:flex;align-items:center;margin-top:10px;">${mock}</div>
  </div>`);

// --- Shared chrome ----------------------------------------------------------
const head = (extra = "") => `
<meta charset="utf-8"/>
<style>
@font-face{font-family:'Convergence';font-style:normal;font-weight:400;font-display:block;
  src:url(data:font/woff2;base64,${fontLatin}) format('woff2');
  unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:'Convergence';font-style:normal;font-weight:400;font-display:block;
  src:url(data:font/woff2;base64,${fontLatinExt}) format('woff2');
  unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1350px;overflow:hidden;}
body{font-family:'Convergence',system-ui,sans-serif;color:${C.ink};
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;
  background:
    radial-gradient(140% 100% at 50% -10%, #fbf8f1 0%, ${C.cream} 46%, #efe7d7 100%);}
.slide::after{content:"";position:absolute;inset:0;pointer-events:none;
  background-image:url("data:image/svg+xml,${grain}");background-size:330px 330px;
  opacity:.05;mix-blend-mode:multiply;}
.edge{position:absolute;inset:0;border:1px solid rgba(0,0,0,.04);}
.pad{position:absolute;inset:0;padding:84px 86px;display:flex;flex-direction:column;}
.hdr{display:flex;width:100%;flex:0 0 auto;align-items:center;justify-content:space-between;}
.brand{display:flex;align-items:center;gap:16px;}
.brand img{width:46px;height:46px;filter:drop-shadow(0 2px 3px rgba(60,40,20,.18));}
.brand .wm{font-size:34px;color:${C.green};letter-spacing:.5px;}
.counter{display:flex;align-items:center;gap:14px;font-size:23px;color:${C.muted};letter-spacing:1px;}
.counter .bar{width:120px;height:5px;border-radius:99px;background:${C.border};overflow:hidden;}
.counter .bar i{display:block;height:100%;background:${C.cork};border-radius:99px;}
.eyebrow{font-size:22px;letter-spacing:4px;text-transform:uppercase;color:${C.corkDeep};}
.pin{position:absolute;top:-19px;left:50%;transform:translateX(-50%);width:38px;height:38px;
  border-radius:50%;background:radial-gradient(circle at 36% 32%, #d8be8e 0%, ${C.cork} 45%, ${C.corkDeep} 100%);
  box-shadow:0 7px 14px rgba(80,55,20,.30),inset 0 -3px 5px rgba(120,85,35,.4),inset 0 2px 3px rgba(255,245,225,.55);}
.pin::after{content:"";position:absolute;top:11px;left:12px;width:9px;height:9px;border-radius:50%;
  background:radial-gradient(circle,#fff5e2 0%,rgba(255,245,226,0) 70%);}
.chip{display:inline-flex;align-items:center;justify-content:center;color:${C.green};
  background:rgba(76,118,66,.10);border:1px solid rgba(76,118,66,.20);}
${extra}
</style>`;

const header = (n) => `
<div class="hdr">
  <div class="brand"><img src="${logo}"/><span class="wm">Suro</span></div>
  <div class="counter"><span class="bar"><i style="width:${(n / 10) * 100}%"></i></span><span>${String(n).padStart(2, "0")} / 10</span></div>
</div>`;

const page = (inner, extraCss = "") =>
  `<!doctype html><html><head>${head(extraCss)}</head><body><div class="slide"><div class="edge"></div>${inner}</div></body></html>`;

// --- Slides -----------------------------------------------------------------
const slides = [];

// 01 — Cover
slides.push(
  page(
    `
  <div class="pad" style="align-items:center;text-align:center;justify-content:center;gap:0;">
    <div style="position:absolute;top:84px;left:0;right:0;display:flex;justify-content:center;">
      <span class="eyebrow">Organitzeu-vos junts</span>
    </div>
    <img src="${logo}" style="width:230px;height:230px;filter:drop-shadow(0 14px 26px rgba(70,45,18,.30));margin-bottom:30px;"/>
    <div style="font-size:88px;color:${C.green};letter-spacing:1px;line-height:1;margin-bottom:42px;">Suro</div>
    <h1 style="font-size:62px;line-height:1.16;max-width:840px;color:${C.ink};">
      El <span style="color:${C.green};">suro compartit</span> per a la gent amb qui comparteixes el dia a dia
    </h1>
    <div style="position:absolute;bottom:92px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:20px;">
      <span style="font-size:27px;color:${C.muted};">Llisca per descobrir-ho&nbsp;&nbsp;→</span>
      <span style="font-size:20px;letter-spacing:3px;text-transform:uppercase;color:${C.corkDeep};">Llistes · Calendari · Despeses · Amic invisible</span>
    </div>
  </div>`,
  ),
);

// 02 — Promise / intro
slides.push(
  page(`
  <div class="pad">
    ${header(2)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:30px;">
      <span class="eyebrow">Tot el que necessita el teu grup</span>
      <h2 style="font-size:64px;line-height:1.15;max-width:900px;">
        Una sola app per a <span style="color:${C.green};">totes les decisions compartides</span>
      </h2>
      <p style="font-size:34px;line-height:1.5;color:${C.muted};max-width:880px;">
        Suro guarda les llistes, els plans, els fitxers i les despeses del teu grup en un sol lloc,
        perquè deixis de saltar entre xats, fulls de càlcul i recordatoris.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;">
        ${[
          "Llistes",
          "Calendari",
          "Fitxers i notes",
          "Despeses",
          "Amic invisible",
          "Notificacions",
        ]
          .map(
            (t) =>
              `<span style="font-size:25px;color:${C.green};background:${C.white};border:1px solid ${C.border};padding:14px 24px;border-radius:99px;box-shadow:0 4px 12px rgba(80,60,30,.06);">${t}</span>`,
          )
          .join("")}
      </div>
    </div>
  </div>`),
);

// 03–08 — Features, each with a faithful mini-mockup of the real app UI.
slides.push(
  featureSlide({
    n: 3,
    icon: I.lists,
    title: "Llistes",
    body: "De la compra, de l'equipatge o de tasques. Categoritza-les, reutilitza plantilles i marqueu-les junts.",
    mock: MOCKS.lists,
  }),
);
slides.push(
  featureSlide({
    n: 4,
    icon: I.calendar,
    title: "Calendari",
    body: "Planifica viatges, sopars i aniversaris, i enllaça-hi una llista perquè ho tinguis tot a punt.",
    mock: MOCKS.calendar,
  }),
);
slides.push(
  featureSlide({
    n: 5,
    icon: I.files,
    title: "Fitxers i notes",
    body: "Comparteix fotos, PDFs i notes amb tot el grup, sense buscar per l'historial del xat.",
    mock: MOCKS.files,
  }),
);
slides.push(
  featureSlide({
    n: 6,
    icon: I.expenses,
    title: "Despeses compartides",
    body: "Apunta qui ha pagat què i Suro calcula la manera més senzilla de quadrar comptes.",
    mock: MOCKS.expenses,
  }),
);
slides.push(
  featureSlide({
    n: 7,
    icon: I.gift,
    title: "Amic invisible",
    body: "Un sorteig amb exclusions i una llista d'idees que només veurà qui et toca.",
    mock: MOCKS.santa,
  }),
);
slides.push(
  featureSlide({
    n: 8,
    icon: I.bell,
    title: "Mantén-te al dia",
    body: "Assabenta't quan algú actualitza una llista, afegeix un pla o salda un deute. Sense el soroll dels xats.",
    mock: MOCKS.notif,
  }),
);

// 09 — Use cases
const useCases = [
  {
    icon: I.home,
    title: "Companys de pis",
    body: "Tingueu la compra, les tasques i les factures sota control, junts, no només al cap d'un.",
  },
  {
    icon: I.users,
    title: "Famílies",
    body: "Dels menús setmanals a l'equipatge de les vacances, compartiu el que importa amb la gent de casa.",
  },
  {
    icon: I.sparkles,
    title: "Colles d'amics",
    body: "Organitzeu el viatge, repartiu les despeses i sorpreneu-vos amb un amic invisible que de debò funciona.",
  },
];
slides.push(
  page(`
  <div class="pad">
    ${header(9)}
    <div style="margin-top:28px;margin-bottom:40px;">
      <span class="eyebrow">Per a qui</span>
      <h2 style="font-size:56px;line-height:1.12;margin-top:18px;max-width:840px;">
        Pensat per als <span style="color:${C.green};">grups de la teva vida</span>
      </h2>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:26px;">
      ${useCases
        .map(
          (u) => `
        <div style="display:flex;align-items:center;gap:34px;background:${C.white};border:1px solid ${C.border};
          border-radius:30px;padding:38px 42px;box-shadow:0 16px 34px -22px rgba(60,40,18,.34);">
          <div class="chip" style="flex:0 0 auto;width:104px;height:104px;border-radius:26px;">${icon(u.icon, 52)}</div>
          <div>
            <div style="font-size:38px;color:${C.green};margin-bottom:10px;">${u.title}</div>
            <div style="font-size:29px;line-height:1.42;color:${C.muted};">${u.body}</div>
          </div>
        </div>`,
        )
        .join("")}
    </div>
  </div>`),
);

// 10 — CTA
slides.push(
  page(`
  <div class="pad" style="text-align:center;align-items:center;">
    ${header(10)}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;">
      <img src="${logo}" style="width:128px;height:128px;filter:drop-shadow(0 10px 20px rgba(70,45,18,.28));"/>
      <h2 style="font-size:62px;line-height:1.14;max-width:860px;">
        Crea el teu primer grup en <span style="color:${C.green};">menys d'un minut</span>
      </h2>
      <p style="font-size:32px;line-height:1.5;color:${C.muted};max-width:820px;">
        Inicia sessió amb Google o amb el teu correu. Sense targeta de crèdit, sense configuració.
        Convida la gent amb qui comparteixes el dia a dia i proveu-ho junts.
      </p>
      <div style="display:flex;align-items:center;gap:30px;margin-top:16px;">
        <img src="${googlePlay}" style="height:78px;width:auto;"/>
        <img src="${appStore}" style="height:78px;width:auto;"/>
      </div>
      <div style="display:flex;align-items:center;gap:15px;margin-top:30px;color:${C.green};font-size:32px;">
        ${icon(I.link, 36, 2.2)}<span>Enllaç a la descripció</span>
      </div>
    </div>
  </div>`),
);

mkdirSync(OUT, { recursive: true });
slides.forEach((html, i) => {
  const name = `slide-${String(i + 1).padStart(2, "0")}.html`;
  writeFileSync(resolve(OUT, name), html);
});
console.log(`Wrote ${slides.length} slide HTML files to ${OUT}`);
