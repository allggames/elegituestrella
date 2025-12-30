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
  setTimeout(()=> modal.classList.add('hidden'), 260);
  confettiContainer.innerHTML = '';
}

starButtons.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    if (locked) return;
    locked = true;

    // Reset visual en todos
    starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
    btn.classList.add('selected');

    // Forzar reflow para que la animación pop funcione correctamente
    void btn.offsetWidth;
    btn.classList.add('pop');

    // Añadir clase flip para rotación 3D
    btn.classList.add('flip');

    // Esperar a que la rotación termine (coincide con transition)
    await wait(820);

    // Elegir premio
    const prize = weightedRandom(prizes);

    // Mostrar modal con resultado
    showPrize(prize);

    // no desbloqueamos hasta cerrar
  });
});

closeBtn.addEventListener('click', () => {
  hidePrize();
  // resetear visual
  starButtons.forEach(s => s.classList.remove('selected','pop','flip'));
  locked = false;
});

function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

/* Confetti simple (emojis) */
function explodeConfetti() {
  confettiContainer.innerHTML = '';
  const emojis = ["✨","🎉","⭐️","💫","🎊"];
  const count = 30;
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'confetti-item';
    el.style.position = 'absolute';
    el.style.left = (Math.random()*100) + '%';
    el.style.top = (-10 - Math.random()*20) + '%';
    el.style.fontSize = (12 + Math.random()*36) + 'px';
    el.style.opacity = (0.6 + Math.random()*0.4);
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    confettiContainer.appendChild(el);

    const duration = 1400 + Math.random()*1600;
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
