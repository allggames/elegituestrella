// Configuración de premios
// Puedes añadir un campo "weight" para cambiar probabilidades
const prizes = [
  { label: "100% de bono + 1000 fichas", bonusPercent: 100, chips: 1000, weight: 1 },
  { label: "150% de bono + 1500 fichas", bonusPercent: 150, chips: 1500, weight: 1 },
  { label: "200% de bono + 2000 fichas", bonusPercent: 200, chips: 2000, weight: 1 }
];

// Si quieres probabilidades diferentes, cambia los weight: e.g. 70,20,10
// Ejemplo: [ {.., weight:70}, {.., weight:20}, {.., weight:10} ]

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
  // confetti simple
  explodeConfetti();
}

function hidePrize() {
  modal.classList.remove('show');
  setTimeout(()=> modal.classList.add('hidden'), 260);
  // limpiar confetti
  confettiContainer.innerHTML = '';
}

starButtons.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    if (locked) return;
    locked = true;
    // animar estrella seleccionada
    const chosen = e.currentTarget;
    starButtons.forEach(s => s.classList.remove('selected'));
    chosen.classList.add('selected');
    chosen.classList.add('pop');

    // breve delay para animación y suspenso
    await wait(700);

    // elegir premio (puedes cambiar a weightedRandom)
    const prize = weightedRandom(prizes);

    // mostrar resultado
    showPrize(prize);

    // mantener bloqueado hasta cerrar
  });
});

closeBtn.addEventListener('click', () => {
  hidePrize();
  // resetear estado visual después de cerrar
  starButtons.forEach(s => {
    s.classList.remove('selected','pop');
  });
  locked = false;
});

function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

/* Confetti muy simple: crea emojis coloridos que caen */
function explodeConfetti() {
  confettiContainer.innerHTML = '';
  const emojis = ["✨","🎉","⭐️","💫","🎊"];
  const count = 24;
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'confetti-item';
    el.style.position = 'absolute';
    el.style.left = (Math.random()*100) + '%';
    el.style.top = (-10 - Math.random()*10) + '%';
    el.style.fontSize = (12 + Math.random()*28) + 'px';
    el.style.opacity = (0.6 + Math.random()*0.4);
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    confettiContainer.appendChild(el);

    // animar caída
    const duration = 1500 + Math.random()*1200;
    el.animate([
      { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity: 1 },
      { transform: `translateY(${60 + Math.random()*140}vh) rotate(${Math.random()*720 - 360}deg)`, opacity: 0.2 }
    ], {
      duration,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards'
    });

    // remover al terminar
    setTimeout(()=> {
      try { el.remove(); } catch(e){}
    }, duration+200);
  }
}
