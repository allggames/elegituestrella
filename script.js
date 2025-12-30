// Premios
const prizes = [
  { label: "100% de bono + 1000 fichas", bonusPercent: 100, chips: 1000, weight: 1 },
  { label: "150% de bono + 1500 fichas", bonusPercent: 150, chips: 1500, weight: 1 },
  { label: "200% de bono + 2000 fichas", bonusPercent: 200, chips: 2000, weight: 1 }
];

const starButtons = Array.from(document.querySelectorAll('.star'));
const modal = document.getElementById('result');
const prizeText = document.getElementById('prize-text');
const closeBtn = document.getElementById('close-btn');
const confettiContainer = document.getElementById('confetti');

let locked = true; // bloqueado hasta que termine la caída inicial

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
  prizeText.textContent = `${prize.label}`;
  modal.classList.remove('hidden');
  modal.classList.add('show');
  explodeConfetti();
}

function hidePrize() {
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 240);
  confettiContainer.innerHTML = '';
}

/* Inicializar sparkles por estrella */
starButtons.forEach((btn) => {
  initSparksFor(btn);
});

/* Click handlers (no se activan hasta que landingDone true) */
starButtons.forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    if (locked) return;
    locked = true;

    starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
    btn.classList.add('selected');

    // Forzar reflow y pop
    void btn.offsetWidth;
    btn.classList.add('pop');

    // Flip 3D
    btn.classList.add('flip');

    // esperar rotación
    await wait(820);

    // elegir premio
    const prize = weightedRandom(prizes);
    showPrize(prize);
    // se desbloqueará al cerrar modal
  });
});

closeBtn.addEventListener('click', () => {
  hidePrize();
  starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
  locked = false;
});

function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

/* Confetti simple */
function explodeConfetti() {
  confettiContainer.innerHTML = '';
  const emojis = ["✨","🎉","⭐️","💫","🎊"];
  const count = 28;
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = (Math.random()*100) + '%';
    el.style.top = (-10 - Math.random()*20) + '%';
    el.style.fontSize = (12 + Math.random()*36) + 'px';
    el.style.opacity = (0.6 + Math.random()*0.4);
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    confettiContainer.appendChild(el);

    const duration = 1400 + Math.random()*1400;
    el.animate([
      { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity: 1 },
      { transform: `translateY(${60 + Math.random()*160}vh) rotate(${Math.random()*900 - 450}deg)`, opacity: 0.2 }
    ], {
      duration,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards'
    });

    setTimeout(()=> { try { el.remove(); } catch(e){} }, duration+220);
  }
}

/* ---------------------------
   Canvas: cielo estrellado animado (twinkle sutil)
   --------------------------- */
const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
let stars = [];
let W = 0, H = 0;
const DPR = Math.max(1, devicePixelRatio || 1);

function resize() {
  W = canvas.width = Math.floor(window.innerWidth * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  initStars();
}
window.addEventListener('resize', () => { resize(); });

function initStars() {
  stars = [];
  const area = window.innerWidth * window.innerHeight;
  const count = Math.max(80, Math.floor(area / 14000));
  for (let i=0;i<count;i++){
    const x = Math.random() * W;
    const y = Math.random() * H * 0.95;
    const r = (Math.random() * 1.8 + 0.4) * DPR;
    const baseA = Math.random() * 0.6 + 0.28;
    const speed = Math.random() * 0.7 + 0.18;
    const amp = Math.random() * 0.22 + 0.06;
    const phase = Math.random() * Math.PI * 2;
    const hasSpark = Math.random() < 0.12;
    stars.push({x,y,r,baseA,speed,amp,phase,hasSpark,sparkTimer:0});
  }
}

let last = performance.now();
function draw(now){
  const dt = (now - last) / 1000;
  last = now;

  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#04101d');
  g.addColorStop(0.5, '#07162b');
  g.addColorStop(1, '#071a2d');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  const vign = ctx.createRadialGradient(W/2, H*0.36, Math.min(W,H)*0.18, W/2, H/2, Math.max(W,H));
  vign.addColorStop(0, 'rgba(20,30,50,0.02)');
  vign.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vign;
  ctx.fillRect(0,0,W,H);

  ctx.globalCompositeOperation = 'screen';
  for (let i=0;i<stars.length;i++){
    const s = stars[i];
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

/* ---------------------------
   Animación de caída inicial (stagger) y habilitar clicks después
   --------------------------- */
window.addEventListener('load', () => {
  const totalDuration = 1100; // ms for transition
  const waitFor = totalDuration + 420;

  // Small initial timeout to ensure CSS applied then remove 'dropping'
  setTimeout(() => {
    document.body.classList.remove('dropping');
    setTimeout(() => { locked = false; }, 420); // enable clicks after landing
  }, 60);
});

/* ---------------------------
   Spark initialiser: create small sparkle spans per star with random pos/delay
   --------------------------- */
function initSparksFor(starEl){
  const count = 3 + Math.floor(Math.random()*3);
  for (let i=0;i<count;i++){
    const sp = document.createElement('span');
    sp.className = 'spark';
    const lx = 28 + Math.random()*44; // percent
    const ty = 18 + Math.random()*40;
    const size = 4 + Math.random()*8;
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

/* evitar selección */
document.addEventListener('selectstart', e => e.preventDefault());
