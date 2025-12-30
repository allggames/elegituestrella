// Premios configurables
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

let locked = false;

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

starButtons.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    if (locked) return;
    locked = true;

    // Reset visual en todos
    starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
    btn.classList.add('selected');

    // Forzar reflow y pop
    void btn.offsetWidth;
    btn.classList.add('pop');

    // Flip 3D
    btn.classList.add('flip');

    // Esperar rotación
    await wait(820);

    // Elegir premio y mostrar
    const prize = weightedRandom(prizes);
    showPrize(prize);
    // bloqueamos hasta cerrar modal
  });
});

closeBtn.addEventListener('click', () => {
  hidePrize();
  starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
  locked = false;
});

function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

/* Confetti simple (emojis) */
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
   Canvas: cielo estrellado animado (twinkle)
   --------------------------- */
const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
let stars = [];
let W = 0, H = 0;

function resize() {
  W = canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  H = canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  initStars();
}
window.addEventListener('resize', () => { resize(); });

function initStars() {
  stars = [];
  const count = Math.max(80, Math.floor((window.innerWidth * window.innerHeight) / 12000));
  for (let i=0;i<count;i++){
    const x = Math.random() * W;
    const y = Math.random() * H * 0.9; // evitar barra inferior
    const r = (Math.random() * 1.6 + 0.4) * devicePixelRatio;
    const tw = Math.random() * 1.6 + 0.2;
    const baseA = Math.random()*0.7 + 0.3;
    const phase = Math.random() * Math.PI * 2;
    stars.push({x,y,r,tw,baseA,phase});
  }
}

let t0 = performance.now();
function draw(now){
  const dt = (now - t0)/1000;
  t0 = now;

  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#061021');
  g.addColorStop(0.5, '#071733');
  g.addColorStop(1, '#071a2d');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // faint nebula / vignette
  const vign = ctx.createRadialGradient(W/2, H*0.35, Math.min(W,H)*0.2, W/2, H/2, Math.max(W,H));
  vign.addColorStop(0, 'rgba(20,30,50,0.02)');
  vign.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vign;
  ctx.fillRect(0,0,W,H);

  // draw stars with twinkle
  for (let i=0;i<stars.length;i++){
    const s = stars[i];
    s.phase += dt * 0.8 * s.tw;
    const a = s.baseA + Math.sin(s.phase) * 0.35 * s.baseA;
    // brighter occasional big glows
    ctx.beginPath();
    const rad = s.r * (1 + Math.sin(s.phase)*0.25);
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad*5);
    grad.addColorStop(0, `rgba(255,255,255,${0.95*a})`);
    grad.addColorStop(0.2, `rgba(255,245,200,${0.55*a})`);
    grad.addColorStop(0.6, `rgba(200,200,255,${0.08*a})`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(s.x - rad*5, s.y - rad*5, rad*10, rad*10);
  }

  // subtle small stars as points for texture
  ctx.globalCompositeOperation = 'lighter';
  for (let i=0;i<Math.min(120, stars.length/2); i++){
    const s = stars[i*2];
    ctx.fillStyle = `rgba(255,255,255,${0.6*s.baseA})`;
    ctx.fillRect(s.x, s.y, 1*devicePixelRatio, 1*devicePixelRatio);
  }
  ctx.globalCompositeOperation = 'source-over';

  requestAnimationFrame(draw);
}

resize();
requestAnimationFrame(draw);

/* inicializa y mantiene canvas en alta densidad */
if (!canvas) {
  console.warn('Canvas no disponible');
}

/* prevent accidental text selection when clicking */
document.addEventListener('selectstart', e => e.preventDefault());
