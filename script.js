const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const button = document.querySelector('.motion-toggle');
let preference = null;
try { preference = localStorage.getItem('portfolio-reduced-motion'); } catch {}
let reduced = preference === null ? media.matches : preference === 'true';
let observer;
const canvas = document.getElementById('dot-grid');
const ctx = canvas.getContext('2d');
let pointer = null, frame = null, width = 0, height = 0;
function draw() {
  frame = null;
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  for (let y = 22; y < height; y += 28) {
    for (let x = 22; x < width; x += 28) {
      const distance = pointer && !reduced ? Math.hypot(x - pointer.x, y - pointer.y) : 1000;
      const glow = Math.max(0, 1 - distance / 180);
      ctx.fillStyle = `rgba(110,145,230,${(0.24 + glow * 0.48) * (1 - y / height)})`;
      ctx.beginPath(); ctx.arc(x, y, 0.85 + glow * 1.4, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function requestDraw() { if (frame === null) frame = requestAnimationFrame(draw); }
function resize() {
  width = innerWidth;
  const hero = document.querySelector('.hero');
  height = Math.min(950, hero.offsetTop + hero.offsetHeight + 100);
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * ratio; canvas.height = height * ratio;
  canvas.style.height = `${height}px`;
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0); requestDraw();
}
function applyMotion() {
  root.dataset.reducedMotion = String(reduced);
  button.setAttribute('aria-pressed', String(reduced));
  const label = reduced ? 'Reduced motion on; enable motion' : 'Reduce motion';
  button.setAttribute('aria-label', label); button.title = label;
  observer?.disconnect(); root.classList.remove('js-motion');
  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('js-motion');
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), {threshold: 0.08});
    document.querySelectorAll('.reveal:not(.visible)').forEach(element => observer.observe(element));
  }
  pointer = null; requestDraw();
}
button.addEventListener('click', () => {
  reduced = !reduced; preference = String(reduced);
  try { localStorage.setItem('portfolio-reduced-motion', preference); } catch {}
  applyMotion();
});
media.addEventListener('change', event => { if (preference === null) { reduced = event.matches; applyMotion(); } });
window.addEventListener('pointermove', event => {
  if (reduced || event.pointerType === 'touch') return;
  pointer = event.pageY < height ? {x:event.pageX, y:event.pageY} : null; requestDraw();
}, {passive:true});
root.addEventListener('pointerleave', () => { pointer = null; requestDraw(); });
window.addEventListener('blur', () => { pointer = null; requestDraw(); });
window.addEventListener('resize', resize);
applyMotion(); resize(); document.fonts?.ready.then(resize);
document.getElementById('year').textContent = new Date().getFullYear();
const progress = document.querySelector('.progress');
let scheduled = false;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? scrollY / distance : 0})`; scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
}, {passive:true});
window.addEventListener('resize', updateProgress); updateProgress();

// Split only the visual copy; the heading keeps a stable accessible name.
const breakButton = document.querySelector('.break-button');
const headline = document.getElementById('hero-title');
const headlineSource = headline.querySelector('.headline-source');
const pieces = headline.querySelector('.headline-pieces');
const breakStatus = document.querySelector('.break-status');
let broken = false;
let restoreTimer;

function buildPieces() {
  pieces.replaceChildren();
  const bounds = headline.getBoundingClientRect();
  const walker = document.createTreeWalker(headlineSource, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const style = getComputedStyle(node.parentElement);
    for (let i = 0; i < node.textContent.length; i++) {
      if (!node.textContent[i].trim()) continue;
      const range = document.createRange();
      range.setStart(node, i); range.setEnd(node, i + 1);
      const box = range.getBoundingClientRect();
      const letter = document.createElement('span');
      letter.className = 'headline-piece';
      letter.textContent = node.textContent[i];
      const x = box.left - bounds.left;
      const y = box.top - bounds.top;
      Object.assign(letter.style, {
        left: `${x}px`, top: `${y}px`, fontFamily: style.fontFamily,
        fontSize: style.fontSize, fontWeight: style.fontWeight,
        fontStyle: style.fontStyle, lineHeight: `${box.height}px`,
        letterSpacing: style.letterSpacing, color: style.color
      });
      // Keep the playful mess inside the heading, away from navigation.
      const margin = Math.min(18, bounds.width * 0.04);
      const maxX = Math.max(margin, bounds.width - box.width - margin);
      const targetX = Math.min(maxX, Math.max(margin, x + (Math.random() - 0.5) * bounds.width * 0.45));
      const targetY = Math.max(0, bounds.height - box.height - 12 - Math.random() * bounds.height * 0.22);
      letter.style.setProperty('--scatter-x', `${targetX - x}px`);
      letter.style.setProperty('--scatter-y', `${targetY - y}px`);
      letter.style.setProperty('--scatter-angle', `${(Math.random() - 0.5) * 36}deg`);
      pieces.append(letter);
    }
  }
}
function restoreHeadline(instant = false) {
  broken = false;
  clearTimeout(restoreTimer);
  headline.classList.remove('headline-broken');
  breakButton.setAttribute('aria-pressed', 'false');
  breakButton.innerHTML = 'Let me break your website <span aria-hidden="true">✳</span>';
  breakStatus.textContent = 'All fixed. Probably.';
  const finish = () => { headline.classList.remove('headline-active'); pieces.replaceChildren(); };
  if (instant || reduced) finish();
  else restoreTimer = setTimeout(finish, 820);
}
if (breakButton && headlineSource && pieces) {
  breakButton.hidden = false;
  breakButton.addEventListener('click', () => {
    if (broken) { restoreHeadline(); return; }
    clearTimeout(restoreTimer);
    buildPieces();
    headline.classList.add('headline-active');
    // Establish starting positions before transitioning to the scattered ones.
    void pieces.offsetWidth;
    headline.classList.add('headline-broken');
    broken = true;
    breakButton.setAttribute('aria-pressed', 'true');
    breakButton.innerHTML = 'Put it back <span aria-hidden="true">↺</span>';
    breakStatus.textContent = 'Well, you did ask.';
  });
  window.addEventListener('resize', () => {
    if (broken || headline.classList.contains('headline-active')) restoreHeadline(true);
  });
}
