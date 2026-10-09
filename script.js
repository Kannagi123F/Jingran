/* ---------- Partículas de fondo ---------- */
const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
let W, H, parts = [];
function resize() { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; }
addEventListener('resize', resize); resize();

const mk = (fromBottom) => ({
  x: Math.random() * W,
  y: fromBottom ? H + 10 : Math.random() * H,
  r: Math.random() * 2.2 + 0.6,
  vy: Math.random() * 0.6 + 0.2,
  sway: Math.random() * 2 * Math.PI,
  a: Math.random() * 0.6 + 0.3
});
for (let i = 0; i < 70; i++) parts.push(mk(false));

/* Chispas que salen de la lámpara (tipo fuego/resonancia) */
const lampEl = document.getElementById('lamp');
const phone = document.getElementById('phone');
let embers = [];
function spawnEmber() {
  const lr = lampEl.getBoundingClientRect(), cr = cv.getBoundingClientRect();
  const cx = lr.left + lr.width / 2 - cr.left, cy = lr.top + lr.height / 2 - cr.top;
  embers.push({
    x: cx + (Math.random() - 0.5) * 50, y: cy + (Math.random() - 0.5) * 40,
    vx: (Math.random() - 0.5) * 0.5, vy: -(Math.random() * 1.1 + 0.4),
    r: Math.random() * 2 + 0.8, life: 0, max: 60 + Math.random() * 60
  });
}

function loop(t) {
  ctx.clearRect(0, 0, W, H);
  for (const p of parts) {
    p.y -= p.vy;
    p.x += Math.sin(t / 900 + p.sway) * 0.3;
    if (p.y < -10) Object.assign(p, mk(true));
    ctx.beginPath();
    ctx.fillStyle = `rgba(80, 255, 200, ${p.a})`;
    ctx.shadowColor = '#2fe0c4'; ctx.shadowBlur = 12;
    ctx.arc(p.x, p.y, p.r, 0, 6.283);
    ctx.fill();
  }

  // Chispas continuas de la lámpara
  const rate = phone.classList.contains('playing') ? 0.9 : 0.35;
  if (Math.random() < rate) spawnEmber();
  ctx.globalCompositeOperation = 'lighter';
  embers = embers.filter(e => e.life < e.max);
  for (const e of embers) {
    e.life++; e.x += e.vx + Math.sin(e.life / 8) * 0.3; e.y += e.vy;
    const k = 1 - e.life / e.max;
    ctx.beginPath();
    ctx.fillStyle = `rgba(190, 255, 240, ${k * 0.9})`;
    ctx.shadowColor = '#2fe0c4'; ctx.shadowBlur = 14;
    ctx.arc(e.x, e.y, e.r * (0.4 + k), 0, 6.283);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* Ráfaga mágica de chispas en el centro al cambiar de personaje */
function burstTransition() {
  const flash = document.getElementById('flash');
  if (flash) {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 280);
  }

  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4.5 + 2;
    embers.push({
      x: W / 2 + (Math.random() - 0.5) * 50,
      y: H / 2 + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 2.8 + 1.2,
      life: 0,
      max: 35 + Math.random() * 30
    });
  }
}

/* ---------- Personajes (edita aquí) ---------- */
const characters = [
  {
    title: 'No One Told Me', artist: 'Wuthering Waves',
    img: 'img/jingran.png', audio: 'audio/jingran-ost.mp3',
    lampX: '17%', lampY: '48%'
  },
{
  title: 'Through the darkest of nights', 
  artist: 'Wuthering Waves',
  img: 'img/jiyan.png', 
  audio: 'audio/jiyan-ost.mp3',
  lampX: '80%', lampY: '82%', // hebillas del hombro
  showLamp: true 
}
];

/* ---------- Reproductor ---------- */
const audio = document.getElementById('audio');
const $ = id => document.getElementById(id);
const icon = $('icon');
const PLAY = 'M8 5v14l11-7z', PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';

$('play').onclick = () => { audio.paused ? audio.play() : audio.pause(); };
audio.onplay = () => { phone.classList.add('playing'); icon.firstElementChild.setAttribute('d', PAUSE); $('play').setAttribute('aria-label', 'Pausar'); };
audio.onpause = () => { phone.classList.remove('playing'); icon.firstElementChild.setAttribute('d', PLAY); $('play').setAttribute('aria-label', 'Reproducir'); };
audio.onloadedmetadata = () => { $('dur').textContent = fmt(audio.duration); };
audio.ontimeupdate = () => {
  const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  $('seek').value = p; $('seek').style.setProperty('--pn', p / 100);$('cur').textContent = fmt(audio.currentTime);
};
$('seek').oninput = e => { if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration; };

/* ---------- Control de Personajes Fantástico ---------- */
const slidesEl = $('slides'), dotsEl =$('dots');
let current = 0;
const slideElements = [];

characters.forEach((c, i) => {
  const s = document.createElement('div');
  s.className = 'slide' + (i === 0 ? ' active' : '');
  s.style.backgroundImage = `url('${c.img}')`;
  slidesEl.appendChild(s);
  slideElements.push(s);

  const d = document.createElement('button');
  d.setAttribute('aria-label', 'Personaje ' + (i + 1));
  d.onclick = () => goTo(i);
  dotsEl.appendChild(d);
});

function goTo(i, first) {
  i = Math.max(0, Math.min(characters.length - 1, i));
  if (i === current && !first) return;

  const wasPlaying = !audio.paused;
  const c = characters[i];

  // Cambio suave de opacidad y escala entre personajes
  slideElements.forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });

  // La lámpara se apaga, se mueve y reaparece suavemente
  lampEl.classList.add('fading');
  setTimeout(() => {
    phone.style.setProperty('--lamp-x', c.lampX);
    phone.style.setProperty('--lamp-y', c.lampY);
    lampEl.classList.remove('fading');
  }, 200);

  if (!first) {
    burstTransition();
  }

  [...dotsEl.children].forEach((d, k) => d.classList.toggle('on', k === i));
  $('title').textContent = c.title;
  $('artist').textContent = c.artist;

  if (i !== current || first) {
    audio.src = c.audio;
    $('seek').value = 0; $('seek').style.setProperty('--pn', 0);$('cur').textContent = '0:00';
    if (wasPlaying) audio.play();
  }
  current = i;
}

/* Deslizar con el dedo o arrastrar con el ratón */
let startX = null, dx = 0;

phone.addEventListener('pointerdown', e => {
  if (e.target.closest('input, button')) return;
  startX = e.clientX;
  dx = 0;
});

phone.addEventListener('pointermove', e => {
  if (startX === null) return;
  dx = e.clientX - startX;
});

function endDrag() {
  if (startX === null) return;
  if (Math.abs(dx) > 45) {
    if (dx < 0 && current < characters.length - 1) {
      goTo(current + 1);
    } else if (dx > 0 && current > 0) {
      goTo(current - 1);
    }
  }
  startX = null;
  dx = 0;
}

phone.addEventListener('pointerup', endDrag);
phone.addEventListener('pointercancel', endDrag);

addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft') goTo(current - 1);
});

goTo(0, true);