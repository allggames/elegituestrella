// script.js
// Versión corregida: asigna rutas / elementos independientes a cada SVG de estrella,
// inicializa sparkles por estrella y conserva el resto de la lógica (clicks, confetti, canvas).

/* ---------------------------
   Geometry: crear "d" para estrella de 5 puntas
   --------------------------- */
function makeStarPath(cx, cy, spikes, outerR, innerR) {
  let rot = -Math.PI / 2; // start at top
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

/* ---------------------------
   Setup per-star SVG: halo, outline, fill, rim, gloss
   Each star gets its own path elements (no shared <use>)
   --------------------------- */
function setupStars() {
  const starEls = Array.from(document.querySelectorAll('.star'));
  if (!starEls.length) return;

  // Per-star visual configs (halo scale, vertical scale for "gordito", gradient id, outline width)
  const configs = [
    { haloScale: 1.22, mainScaleY: 1.28, gradient: 'url(#fill1)', outlineW: 8 },
    { haloScale: 1.30, mainScaleY: 1.36, gradient: 'url(#fill2)', outlineW: 9 },
    { haloScale: 1.22, mainScaleY: 1.28, gradient: 'url(#fill3)', outlineW: 8 }
  ];

  // Base star geometry (centered in 0..120 viewBox at 60,60)
  const cx = 60, cy = 60;
  const outer = 46, inner = 20;
  const d = makeStarPath(cx, cy, 5, outer, inner);

  starEls.forEach((btn, i) => {
    const svg = btn.querySelector('.star-svg');
    if (!svg) return;

    // Find or create elements inside this SVG so each star is independent
    function ensure(tag, cls, attrs = {}) {
      let el = svg.querySelector(`.${cls}`);
      if (!el) {
        el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        el.setAttribute('class', cls);
        svg.insertBefore(el, svg.firstChild);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    }

    const halo = ensure('path', 'star-halo');
    const outline = ensure('path', 'star-outline');
    const fill = ensure('path', 'star-fill');
    const rim = ensure('path', 'star-rim');
    const gloss = svg.querySelector('.star-gloss') || ensure('ellipse', 'star-gloss', { cx: 46, cy: 34, rx: 22, ry: 9 });

    const cfg = configs[i] || configs[0];

    // Assign the same geometry to each path (independent elements)
    halo.setAttribute('d', d);
    outline.setAttribute('d', d);
    fill.setAttribute('d', d);
    rim.setAttribute('d', d);

    // Halo: larger + svg filter for blur (preferred)
    halo.setAttribute('fill', cfg.gradient);
    halo.setAttribute('opacity', '0.92');
    halo.setAttribute('filter', 'url(#haloBlur)');
    halo.setAttribute('transform', `translate(${cx} ${cy}) scale(${cfg.haloScale}) translate(${-cx} ${-cy})`);

    // Outline: brown stroke, slightly larger than main
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', '#7a3e1f');
    outline.setAttribute('stroke-width', String(cfg.outlineW));
    outline.setAttribute('stroke-linejoin', 'round');
    outline.setAttribute('transform', `translate(${cx} ${cy}) scale(${cfg.haloScale}) translate(${-cx} ${-cy})`);

    // Fill: main body, scale Y for "gordito"
    fill.setAttribute('fill', cfg.gradient);
    fill.setAttribute('stroke', 'rgba(0,0,0,0.06)');
    fill.setAttribute('stroke-width', '1.1');
    fill.setAttribute('transform', `translate(${cx} ${cy}) scale(1 ${cfg.mainScaleY}) translate(${-cx} ${-cy})`);

    // Rim: subtle inner light stroke (slightly smaller)
    rim.setAttribute('fill', 'none');
    rim.setAttribute('stroke', 'rgba(255,255,255,0.18)');
    rim.setAttribute('stroke-width', '6');
    rim.setAttribute('stroke-linejoin', 'round');
    rim.setAttribute('transform', `translate(${cx} ${cy}) scale(0.96) translate(${-cx} ${-cy})`);

    // Gloss: keep ellipse on top
    gloss.setAttribute('fill', 'rgba(255,255,255,0.95)');
    gloss.setAttribute('opacity', '0.95');
    if (i === 1) {
      gloss.setAttribute('cx', '50');
      gloss.setAttribute('cy', '34');
      gloss.setAttribute('rx', '26');
      gloss.setAttribute('ry', '12');
      gloss.setAttribute('transform', 'rotate(-16 50 34)');
    } else {
      // ensure transform attribute present for consistency
      const cxg = gloss.getAttribute('cx') || '46';
      const cyg = gloss.getAttribute('cy') || '34';
      // keep existing values
    }
  });
}

/* ---------------------------
   UI + interaction logic
   --------------------------- */

// We'll call setupStars on DOMContentLoaded, then initialize interactions
document.addEventListener('DOMContentLoaded', () => {
  setupStars();

  // Re-query star buttons after setup
  const starButtonsLocal = Array.from(document.querySelectorAll('.star'));

  // initialize sparkles for each star
  starButtonsLocal.forEach(btn => initSparksFor(btn));

  // click handlers (enable after landing)
  starButtonsLocal.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (locked) return;
      locked = true;
      starButtonsLocal.forEach(s => s.classList.remove('selected','pop','flip'));
      btn.classList.add('selected');
      void btn.offsetWidth;
      btn.classList.add('pop','flip');
      await wait(760);
      const prize = weightedRandom(prizes);
      showPrize(prize);
    });
  });

  // close button handler (modal)
  const closeBtnLocal = document.getElementById('close-btn');
  if (closeBtnLocal) {
    closeBtnLocal.addEventListener('click', () => {
      hidePrize();
      starButtonsLocal.forEach(s => s.classList.remove('selected','pop','flip'));
      locked = false;
    });
  }
});

/* keep existing prize/confetti/canvas code below (unchanged) */

// Weighted random helper (unchanged)
function weightedRandom(arr) {
  const total = arr.reduce((s, x) => s + (x.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) {
    r -= (item.weight || 1);
    if (r <= 0) return item;
  }
  return arr[arr.length - 1];
}

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
  setTimeout(()=> {
    if (modal) modal.classList.add('hidden');
  }, 260);
  const confettiContainer = document.getElementById('confetti');
  if (confettiContainer) confettiContainer.innerHTML = '';
}

/* confetti (unchanged) */
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

/* Canvas sky (twinkle) - unchanged from your version */
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

/* sparks (per star DOM element) */
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

/* landing: remove dropping and enable clicks after animations */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.body.classList.remove('dropping');
    // small buffer for transitions
    setTimeout(() => { locked = false; }, 600);
  }, 60);
});

/* prevent text selection while interacting */
document.addEventListener('selectstart', e => e.preventDefault());
