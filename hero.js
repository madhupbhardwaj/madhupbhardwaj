/* Walking pixel character. Arrow keys (or A / D) to walk. */
(() => {
  const SPEED = 200;          // pixels per second
  const SIZE = 64;            // sprite width in px, must match hero.css
  const START_X = 80;

  const walker = document.createElement('div');
  walker.className = 'hero-walker';
  walker.setAttribute('aria-hidden', 'true');
  walker.innerHTML = '<span class="hero-hint">← → to walk</span><div class="hero-sprite"></div>';
  document.body.appendChild(walker);

  const sprite = walker.querySelector('.hero-sprite');
  const keys = new Set();
  let x = START_X;
  let dir = 1;
  let last = 0;
  let raf = 0;

  const LEFT = ['ArrowLeft', 'a', 'A'];
  const RIGHT = ['ArrowRight', 'd', 'D'];

  const maxX = () => Math.max(0, document.documentElement.clientWidth - SIZE);
  const render = () => {
    walker.style.transform = `translate3d(${x}px,0,0)`;
    sprite.style.transform = `scaleX(${dir})`;
  };

  // Don't steal keys from form controls, sliders, dialogs or shortcuts.
  const blocked = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return true;
    if (document.querySelector('dialog[open]')) return true;
    const t = e.target;
    return !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], [role="slider"]'));
  };

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const left = LEFT.some((k) => keys.has(k));
    const right = RIGHT.some((k) => keys.has(k));
    const moving = left !== right;
    if (moving) {
      dir = right ? 1 : -1;
      x = Math.max(0, Math.min(maxX(), x + dir * SPEED * dt));
    }
    sprite.classList.toggle('is-walking', moving);
    render();
    raf = keys.size ? requestAnimationFrame(tick) : 0;
    if (!keys.size) sprite.classList.remove('is-walking');
  };

  const start = () => {
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  };

  const stop = () => {
    keys.clear();
    sprite.classList.remove('is-walking');
  };

  addEventListener('keydown', (e) => {
    if (![...LEFT, ...RIGHT].includes(e.key) || blocked(e)) return;
    if (getComputedStyle(walker).display === 'none') return;
    keys.add(e.key);
    walker.dataset.moved = 'true';
    start();
  });
  addEventListener('keyup', (e) => keys.delete(e.key));
  addEventListener('blur', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  addEventListener('resize', () => { x = Math.min(x, maxX()); render(); });

  render();
})();
