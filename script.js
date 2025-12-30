// script.js
// Restaurado: flip, reveal prize, confetti, sparkles.
// Alineación corregida: outline y fill usan la misma transform (coinciden).
// Gloss (óvalo blanco) oculto por defecto.

(function(){ 'use strict';

/* ---------- Geometry: crear "d" para estrella de 5 puntas ---------- */
function makeStarPath(cx, cy, spikes, outerR, innerR) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  let d = '';
  for (let i = 0; i < spikes; i++) {
    const xOuter = cx + Math.cos(rot) * outerR;
    const yOuter = cy + Math.sin(rot) * outerR;
    d += (i === 0 ? `M ${xOuter} ${yOuter} ` : `L ${xOuter} ${yOuter} `);
    rot += step;
    const xInner = cx + Math.cos(rot) * innerR;
    const yInner = cy + Math.sin(rot) * innerR;
    d += `L ${xInner} ${yInner} `;
    rot += step;
  }
  d += 'Z';
  return d;
}

/* ---------- Setup: asignar paths independientes por estrella ---------- */
function setupStars() {
  const starEls = Array.from(document.querySelectorAll('.star'));
  if (!starEls.length) return;

  const configs = [
    { haloScale: 1.22, mainScaleY: 1.28, gradient: 'url(#fill1)', outlineW: 7 },
    { haloScale: 1.23, mainScaleY: 1.30, gradient: 'url(#fill2)', outlineW: 8 },
    { haloScale: 1.22, mainScaleY: 1.28, gradient: 'url(#fill3)', outlineW: 7 }
  ];

  const cx = 60, cy = 60;
  const outer = 46, inner = 20;
  const d = makeStarPath(cx, cy, 5, outer, inner);

  starEls.forEach((btn, i) => {
    const svg = btn.querySelector('.star-svg');
    if (!svg) return;

    // create element helper
    function ensure(tag, cls) {
      let el = svg.querySelector(`.${cls}`);
      if (!el) {
        el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        el.setAttribute('class', cls);
        svg.appendChild(el);
      }
      return el;
    }

    // Elements order: halo (back) -> outline -> fill -> rim -> gloss (top)
    const halo = ensure('path','star-halo');
    const outline = ensure('path','star-outline');
    const fill = ensure('path','star-fill');
    const rim = ensure('path','star-rim');
    const gloss = ensure('ellipse','star-gloss');

    const cfg = configs[i] || configs[0];

    // assign geometry
    halo.setAttribute('d', d);
    outline.setAttribute('d', d);
    fill.setAttribute('d', d);
    rim.setAttribute('d', d);

    // halo (blur filter must exist in index.html)
    halo.setAttribute('fill', cfg.gradient);
    halo.setAttribute('opacity', '0.92');
    halo.setAttribute('filter', 'url(#haloBlur)');
    halo.setAttribute('transform', `translate(${cx} ${cy}) scale(${cfg.haloScale}) translate(${-cx} ${-cy})`);

    // outline - SAME scaleY as fill so it matches exactly (drawn before fill so it doesn't cover highlights)
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', '#7a3e1f');
    outline.setAttribute('stroke-width', String(cfg.outlineW));
    outline.setAttribute('stroke-linejoin', 'round');
    outline.setAttribute('transform', `translate(${cx} ${cy}) scale(1 ${cfg.mainScaleY}) translate(${-cx} ${-cy})`);
    outline.style.pointerEvents = 'none';

    // fill - main yellow body
    fill.setAttribute('fill', cfg.gradient);
    fill.setAttribute('stroke', 'rgba(0,0,0,0.06)');
    fill.setAttribute('stroke-width', '1.1');
    fill.setAttribute('transform', `translate(${cx} ${cy}) scale(1 ${cfg.mainScaleY}) translate(${-cx} ${-cy})`);

    // rim - subtle inner bright stroke
    rim.setAttribute('fill', 'none');
    rim.setAttribute('stroke', 'rgba(255,255,255,0.16)');
    rim.setAttribute('stroke-width', '5.5');
    rim.setAttribute('stroke-linejoin', 'round');
    rim.setAttribute('transform', `translate(${cx} ${cy}) scale(0.96) translate(${-cx} ${-cy})`);
    rim.style.pointerEvents = 'none';

    // gloss: user asked to remove the big white oval -> hide it
    gloss.setAttribute('fill', 'rgba(255,255,255,0.96)');
    gloss.setAttribute('opacity', '0'); // hidden
    // if you want small specular instead, we can set opacity to 0.85 and small rx/ry here.
  });
}

/* ---------- Interaction & UI logic ---------- */
const prizes = [
  { label: "100% de bono + 1000 fichas", weight: 1 },
  { label: "150% de bono + 1500 fichas", weight: 1 },
  { label: "200% de bono + 2000 fichas", weight: 1 }
];

function weightedRandom(arr) {
  const total = arr.reduce((s, x) => s + (x.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) {
    r -= (item.weight || 1);
    if (r <= 0) return item;
  }
  return arr[arr.length - 1];
}

let locked = true;
function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

function showPrize(prize) {
  const prizeText = document.getElementById('prize-text');
  const modal = document.getElementById('result');
  if (prizeText) prizeText.textContent = prize.label;
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('show');
  }
  explodeConfetti();
}
function hidePrize() {
  const modal = document.getElementById('result');
  if (modal) modal.classList.remove('show');
  setTimeout(()=> { if (modal) modal.classList.add('hidden'); }, 260);
  const confettiContainer = document.getElementById('confetti');
  if (confettiContainer) confettiContainer.innerHTML = '';
}

/* ---------- DOM ready: setup + interactions ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupStars();

  const starButtons = Array.from(document.querySelectorAll('.star'));
  const closeBtn = document.getElementById('close-btn');

  // initialize sparkles for each star (DOM helper below)
  starButtons.forEach(btn => initSparksFor(btn));

  // click handlers (restore flip/pop and prize reveal)
  starButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (locked) return;
      locked = true;
      starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
      btn.classList.add('selected');
      void btn.offsetWidth; // reflow
      btn.classList.add('pop','flip');
      await wait(760);
      const prize = weightedRandom(prizes);
      showPrize(prize);
      // unlocking happens on modal close
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', () => {
    hidePrize();
    starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
    locked = false;
  });
});

/* ---------- Confetti (emoji) ---------- */
function explodeConfetti() {
  const confettiContainer = document.getElementById('confetti');
  if (!confettiContainer) return;
  confettiContainer.innerHTML = '';
  const emojis = ["✨","🎉","⭐️","💫","🎊"];
  const count = 28;
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = (42 + Math.random()*16) + '%';
    el.style.top = (40 + Math.random()*12) + '%';
    el.style.fontSize = (12 + Math.random()*28) + 'px';
    el.style.opacity = (0.6 + Math.random()*0.4);
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    confettiContainer.appendChild(el);

    const duration = 1100 + Math.random()*1400;
    el.animate([
      { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity: 1 },
      { transform: `translateY(${80 + Math.random()*120}vh) rotate(${Math.random()*900 - 450}deg)`, opacity: 0.2 }
    ], { duration, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });

    setTimeout(()=> { try { el.remove(); } catch(e){} }, duration+220);
  }
}

/* ---------- Canvas sky (twinkle) ---------- */
const canvas = document.getElementById('sky');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
let skyStars = [], W=0, H=0;
const DPR = Math.max(1, window.devicePixelRatio || 1);

function resize() {
  if (!canvas || !ctx) return;
  W = canvas.width = Math.floor(window.innerWidth * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  initStars();
}
window.addEventListener('resize', resize);

function initStars() {
  skyStars = [];
  const area = window.innerWidth * window.innerHeight;
  const count = Math.max(60, Math.floor(area / 16000));
  for (let i=0;i<count;i++){
    const x = Math.random() * W;
    const y = Math.random() * H * 0.95;
    const r = (Math.random() * 1.6 + 0.4) * DPR;
    const baseA = Math.random() * 0.6 + 0.3;
    const speed = Math.random() * 0.6 + 0.2;
    const amp = Math.random() * 0.22 + 0.06;
    const phase = Math.random() * Math.PI * 2;
    const hasSpark = Math.random() < 0.12;
    skyStars.push({x,y,r,baseA,speed,amp,phase,hasSpark,sparkTimer:0});
  }
}

let last = performance.now();
function draw(now){
  if (!ctx) return;
  const dt = (now - last) / 1000;
  last = now;
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#04101d'); g.addColorStop(0.5, '#07162a'); g.addColorStop(1, '#071a2d');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  const vign = ctx.createRadialGradient(W/2, H*0.36, Math.min(W,H)*0.18, W/2, H/2, Math.max(W,H));
  vign.addColorStop(0,'rgba(20,30,50,0.02)'); vign.addColorStop(1,'rgba(0,0,0,0.28)');
  ctx.fillStyle = vign; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation = 'screen';
  for (let i=0;i<skyStars.length;i++){
    const s = skyStars[i];
    s.phase += dt * s.speed;
    let tw = s.baseA * (1 + Math.sin(s.phase) * s.amp);
    if (s.hasSpark && Math.random() < 0.006) { s.sparkTimer = 0.12 + Math.random() * 0.34; }
    if (s.sparkTimer > 0) { tw += 0.6 * Math.exp(-5 * (0.4 - s.sparkTimer)); s.sparkTimer -= dt; }
    const rad = s.r * (1 + Math.sin(s.phase) * 0.12);
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad*4.5);
    grad.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.95 * tw)})`);
    grad.addColorStop(0.2, `rgba(255,245,200,${0.45 * tw})`);
    grad.addColorStop(0.6, `rgba(200,200,255,${0.06 * tw})`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(s.x - rad*4.5, s.y - rad*4.5, rad*9, rad*9);
    ctx.fillStyle = `rgba(255,255,255,${0.35 * tw})`;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.max(1, DPR), Math.max(1, DPR));
  }
  ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(draw);
}
resize();
requestAnimationFrame(draw);

/* ---------- Sparks per star element ---------- */
function initSparksFor(starEl){
  if (!starEl) return;
  const count = 3 + Math.floor(Math.random()*3);
  for (let i=0;i<count;i++){
    const sp = document.createElement('span');
    sp.className = 'spark';
    const lx = 24 + Math.random()*52;
    const ty = 14 + Math.random()*46;
    const size = 3 + Math.random()*8;
    const dur = (0.9 + Math.random()*1.6).toFixed(2) + 's';
    const delay = (Math.random()*1.8).toFixed(2) + 's';
    sp.style.left = lx + '%';
    sp.style.top = ty + '%';
    sp.style.width = size + 'px';
    sp.style.height = size + 'px';
    sp.style.setProperty('--dur', dur);
    sp.style.setProperty('--delay', delay);
    starEl.appendChild(sp);
  }
}

/* ---------- Landing animation and unlock ---------- */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.body.classList.remove('dropping');
    setTimeout(() => { locked = false; }, 600);
  }, 60);
});

/* prevent selection */
document.addEventListener('selectstart', e => e.preventDefault());

})(); 
