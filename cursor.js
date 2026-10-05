(() => {
  'use strict';
  const root = document.documentElement;
  const pointerMedia = matchMedia('(hover: hover) and (pointer: fine)');
  const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
  const contrastMedia = matchMedia('(forced-colors: active)');
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
  ring.append(document.createElement('span'));
  dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring);
  let active = false, frame = 0, lastTime = 0;
  let x = 0, y = 0, ringX = 0, ringY = 0;
  const allowed = () => pointerMedia.matches && !motionMedia.matches && !contrastMedia.matches && root.dataset.reducedMotion !== 'true' && !document.querySelector('dialog[open]');
  function hide() {
    active = false; root.classList.remove('custom-cursor');
    ring.classList.remove('is-down', 'is-link');
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
  }
  function paint() {
    ring.style.transform = `translate3d(${ringX}px,${ringY}px,0)`;
  }
  function tick(now) {
    frame = 0;
    if (!active) return;
    const delta = lastTime ? Math.min(now - lastTime, 64) : 16;
    lastTime = now;
    const amount = 1 - Math.exp(-delta / 48);
    ringX += (x - ringX) * amount; ringY += (y - ringY) * amount;
    paint();
    if (Math.abs(x - ringX) + Math.abs(y - ringY) > .12) frame = requestAnimationFrame(tick);
    else { ringX = x; ringY = y; paint(); lastTime = 0; }
  }
  window.addEventListener('pointermove', event => {
    const target = event.target;
    // Keep native text, resize, and drag affordances where they are useful.
    if (event.pointerType !== 'mouse' || !allowed() || !(target instanceof Element) || target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),canvas,iframe')) { hide(); return; }
    x = event.clientX; y = event.clientY;
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (!active) { ringX = x; ringY = y; paint(); active = true; root.classList.add('custom-cursor'); }
    ring.classList.toggle('is-link', !!target.closest('a,button,summary,[role="button"]'));
    if (!frame) frame = requestAnimationFrame(tick);
  }, {passive:true});
  window.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') hide(); else if (active) ring.classList.add('is-down'); }, {passive:true});
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'), {passive:true});
  window.addEventListener('pointercancel', hide);
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hide(); });
  window.addEventListener('blur', hide);
  window.addEventListener('scroll', hide, {passive:true});
  document.addEventListener('visibilitychange', hide);
  document.addEventListener('keydown', event => { if (event.key === 'Tab') hide(); });
  [pointerMedia,motionMedia,contrastMedia].forEach(media => media.addEventListener('change', hide));
  new MutationObserver(() => { if (!allowed()) hide(); }).observe(root, {attributes:true,attributeFilter:['data-reduced-motion']});
  document.querySelectorAll('dialog').forEach(dialog => new MutationObserver(hide).observe(dialog, {attributes:true,attributeFilter:['open']}));
})();
