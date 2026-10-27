/* Walking pixel character. Arrow keys (or A / D) to walk, Space / ↑ / W to jump (twice for a double jump).
   Lines of text and visible blocks act as one-way platforms: jump up through them, land on them on the way down. */
(() => {
  const SPEED = 200;          // pixels per second
  const SIZE = 64;            // sprite width in px, must match hero.css
  const START_X = 80;
  const JUMP_VELOCITY = 520;  // initial upward velocity in px/s
  const GRAVITY = 1400;       // downward acceleration in px/s²
  const MAX_JUMPS = 2;        // ground jump + one mid-air jump
  const FOOT = 14;            // half-width of the feet, so it can't stand on transparent sprite padding
  const MIN_HEAD_ROOM = SIZE; // fall once the platform scrolls too close to the top of the screen

  // Blocks without their own text that should still be solid.
  const SOLID = 'img, button, canvas.mobius-canvas, .project-art, .shelf-book, .shelf-plank, .papers-title, .quote-card, .linkedin-button';
  // Never platforms: the walker itself, overlays, fixed chrome and hidden UI.
  const IGNORE = '.hero-walker, dialog, script, style, noscript, .sr-only, .header, .section-dock, .progress, #dot-grid, .cursor-dot, .cursor-ring, [hidden]';

  const walker = document.createElement('div');
  walker.className = 'hero-walker';
  walker.setAttribute('aria-hidden', 'true');
  walker.innerHTML = '<span class="hero-hint">← → to walk · Space to jump</span><div class="hero-sprite"></div>';
  document.body.appendChild(walker);

  const sprite = walker.querySelector('.hero-sprite');
  const keys = new Set();
  let x = START_X;
  let dir = 1;
  let last = 0;
  let raf = 0;

  // Jump state
  let y = 0;              // feet height above the bottom of the screen (positive = up)
  let vy = 0;             // vertical velocity (positive = upward)
  let grounded = true;    // true when standing on the ground or a platform
  let jumpRequested = false; // buffered jump input, consumed in tick
  let jumpsLeft = MAX_JUMPS;
  let platform = null;    // function returning the current rect of the surface we stand on, or null for the ground

  const LEFT = ['ArrowLeft', 'a', 'A'];
  const RIGHT = ['ArrowRight', 'd', 'D'];
  const JUMP = [' ', 'ArrowUp', 'w', 'W'];
  const ALL_KEYS = [...LEFT, ...RIGHT, ...JUMP];

  const viewH = () => document.documentElement.clientHeight;
  const maxX = () => Math.max(0, document.documentElement.clientWidth - SIZE);
  const render = () => {
    walker.style.transform = `translate3d(${x}px,${-y}px,0)`;
    sprite.style.transform = `scaleX(${dir})`;
  };

  // Candidate surfaces: every visible text node plus the SOLID blocks. Rebuilt at most once a second.
  let candidates = [];
  let builtAt = -Infinity;
  const collect = (now) => {
    if (now - builtAt < 1000) return;
    builtAt = now;
    candidates = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.data.trim() && !n.parentElement.closest(IGNORE) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    for (let n; (n = tw.nextNode());) candidates.push({ el: n.parentElement, text: n });
    document.querySelectorAll(SOLID).forEach((el) => { if (!el.closest(IGNORE)) candidates.push({ el }); });
  };

  const visible = (el) => !el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  const solidRect = (r) => r.width >= 4 && r.height >= 4;
  const overlapsFeet = (r) => {
    const mid = x + SIZE / 2;
    return r.right > mid - FOOT && r.left < mid + FOOT;
  };

  // Each surface is a getter so a platform can be re-measured every frame while the page scrolls.
  const surfaces = (c) => {
    if (!c.text) return [() => c.el.getBoundingClientRect()];
    const range = document.createRange();
    range.selectNodeContents(c.text);
    return Array.from(range.getClientRects(), (_, i) => () => {
      if (!c.text.isConnected) return null;
      range.selectNodeContents(c.text);
      return range.getClientRects()[i] || null;
    });
  };

  // Highest surface whose top the feet crossed this frame (screen Y grows downward).
  const findLanding = (fromFeet, toFeet) => {
    let best = null, bestTop = Infinity;
    for (const c of candidates) {
      const box = c.el.getBoundingClientRect();
      if (box.bottom < fromFeet || box.top > toFeet || !overlapsFeet(box) || !visible(c.el)) continue;
      for (const get of surfaces(c)) {
        const r = get();
        if (r && solidRect(r) && r.top >= fromFeet && r.top <= toFeet && r.top < bestTop && overlapsFeet(r)) {
          best = get; bestTop = r.top;
        }
      }
    }
    return best && { get: best, top: bestTop };
  };

  const land = () => {
    vy = 0;
    grounded = true;
    jumpsLeft = MAX_JUMPS;
    sprite.classList.remove('is-jumping');
  };

  const fall = () => {
    platform = null;
    grounded = false;
    vy = 0;
    jumpsLeft = MAX_JUMPS - 1; // walking off an edge still leaves the mid-air jump
    sprite.classList.add('is-jumping');
    sprite.classList.remove('is-walking');
  };

  // Don't steal keys from form controls, sliders, dialogs or shortcuts.
  const blocked = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return true;
    if (document.querySelector('dialog[open]')) return true;
    const t = e.target;
    if (!t || !t.closest) return false;
    if (t.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return true;
    // Space still presses whatever button or link has focus.
    return e.key === ' ' && !!t.closest('a, button, summary, [role="button"], [tabindex]');
  };

  const tick = (now) => {
    // rAF timestamps can predate the performance.now() taken in start(), so clamp at zero.
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    const H = viewH();

    // Horizontal movement
    const left = LEFT.some((k) => keys.has(k));
    const right = RIGHT.some((k) => keys.has(k));
    const moving = left !== right;
    if (moving) {
      dir = right ? 1 : -1;
      x = Math.max(0, Math.min(maxX(), x + dir * SPEED * dt));
    }

    // Follow the platform as the page scrolls; drop off when it leaves, ends or nears the top.
    if (platform) {
      const r = platform();
      if (!r || !solidRect(r) || !overlapsFeet(r) || r.top >= H || r.top < MIN_HEAD_ROOM) fall();
      else y = H - r.top;
    }

    // Consume buffered jump input
    if (jumpRequested && jumpsLeft > 0) {
      jumpsLeft -= 1;
      grounded = false;
      platform = null;
      vy = JUMP_VELOCITY;
      sprite.classList.add('is-jumping');
      sprite.classList.remove('is-walking');
    }
    jumpRequested = false;

    // Jump physics: only land while moving downward, so platforms are passable from below.
    if (!grounded) {
      const fromFeet = H - y;
      vy -= GRAVITY * dt;
      y += vy * dt;
      const hit = vy < 0 && (collect(now), findLanding(fromFeet, H - y));
      if (hit && hit.top < H) {
        platform = hit.get;
        y = H - hit.top;
        land();
      } else if (y <= 0 && vy <= 0) {
        y = 0;
        land();
      }
    }

    if (grounded) sprite.classList.toggle('is-walking', moving);
    render();
    const active = keys.size || !grounded;
    raf = active ? requestAnimationFrame(tick) : 0;
    if (!active) sprite.classList.remove('is-walking');
  };

  const start = () => {
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  };

  const stop = () => {
    keys.clear();
    jumpRequested = false;
    sprite.classList.remove('is-walking');
  };

  addEventListener('keydown', (e) => {
    if (!ALL_KEYS.includes(e.key) || blocked(e)) return;
    if (getComputedStyle(walker).display === 'none') return;
    if (JUMP.includes(e.key)) e.preventDefault(); // prevent page scroll
    if (e.repeat) return;                          // ignore held-key repeats
    keys.add(e.key);
    walker.dataset.moved = 'true';
    if (JUMP.includes(e.key)) jumpRequested = true;
    start();
  });
  addEventListener('keyup', (e) => keys.delete(e.key));
  addEventListener('blur', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  // A single frame re-measures the platform, so the character rides along with scrolling content.
  addEventListener('scroll', () => { if (platform) start(); }, { passive: true });
  addEventListener('resize', () => { x = Math.min(x, maxX()); if (platform) start(); render(); });

  render();
})();
