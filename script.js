const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const button = document.querySelector('.motion-toggle');

let preference = null;
try {
  preference = localStorage.getItem('portfolio-reduced-motion');
} catch {}

let reduced = preference === null
  ? media.matches
  : preference === 'true';

let observer;

const canvas = document.getElementById('dot-grid');
const ctx = canvas.getContext('2d');

let pointer = null;
let frame = null;
let width = 0;
let height = 0;

function draw() {
  frame = null;
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  for (let y = 22; y < height; y += 28) {
    for (let x = 22; x < width; x += 28) {
      const distance = pointer && !reduced
        ? Math.hypot(x - pointer.x, y - pointer.y)
        : 1000;

      const glow = Math.max(0, 1 - distance / 180);
      const opacity = (0.16 + glow * 0.42) * (1 - y / height);

      ctx.fillStyle = `rgba(110,145,230,${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.85 + glow * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function requestDraw() {
  if (frame === null) {
    frame = requestAnimationFrame(draw);
  }
}

function resize() {
  width = innerWidth;

  const hero = document.querySelector('.hero');
  height = Math.min(
    950,
    hero.offsetTop + hero.offsetHeight + 100
  );

  const ratio = Math.min(devicePixelRatio || 1, 2);

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.height = `${height}px`;

  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  requestDraw();
}

function applyMotion() {
  root.dataset.reducedMotion = String(reduced);
  button.setAttribute('aria-pressed', String(reduced));

  const label = reduced
    ? 'Reduced motion on; enable motion'
    : 'Reduce motion';

  button.setAttribute('aria-label', label);
  button.title = label;

  observer?.disconnect();
  root.classList.remove('js-motion');

  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('js-motion');

    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal:not(.visible)')
      .forEach(element => observer.observe(element));
  }

  pointer = null;
  requestDraw();
}

button.addEventListener('click', () => {
  reduced = !reduced;
  preference = String(reduced);

  try {
    localStorage.setItem(
      'portfolio-reduced-motion',
      preference
    );
  } catch {}

  applyMotion();
});

media.addEventListener('change', event => {
  if (preference === null) {
    reduced = event.matches;
    applyMotion();
  }
});

window.addEventListener('pointermove', event => {
  if (reduced || event.pointerType === 'touch') return;

  pointer = event.pageY < height
    ? { x: event.pageX, y: event.pageY }
    : null;

  requestDraw();
}, { passive: true });

root.addEventListener('pointerleave', () => {
  pointer = null;
  requestDraw();
});

window.addEventListener('blur', () => {
  pointer = null;
  requestDraw();
});

window.addEventListener('resize', resize);

applyMotion();
resize();
document.fonts?.ready.then(resize);

document.getElementById('year').textContent =
  new Date().getFullYear();

const progress = document.querySelector('.progress');
let scheduled = false;

function updateProgress() {
  const distance =
    document.documentElement.scrollHeight - innerHeight;

  progress.style.transform =
    `scaleX(${distance > 0 ? scrollY / distance : 0})`;

  scheduled = false;
}

window.addEventListener('scroll', () => {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(updateProgress);
  }
}, { passive: true });

window.addEventListener('resize', updateProgress);
updateProgress();
