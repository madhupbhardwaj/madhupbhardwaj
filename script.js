// Book spines are ordinary buttons, so keyboard and touch share the same action.
document.querySelectorAll('.shelf-book').forEach(book => {
  book.addEventListener('click', () => {
    document.querySelectorAll('.shelf-book').forEach(item => item.setAttribute('aria-pressed', String(item === book)));
    const details = document.getElementById('book-details');
    details.querySelector('h3').textContent = book.dataset.title;
    details.querySelector('p').textContent = book.dataset.author;
  });
});
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
    // The control lives in the Lab; show the hero where the effect happens.
    headline.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
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
    // The control is further down the page, so restore the heading on its own.
    restoreTimer = setTimeout(() => restoreHeadline(), 6000);
  });
  window.addEventListener('resize', () => {
    if (broken || headline.classList.contains('headline-active')) restoreHeadline(true);
  });
}

// Layer k contains exactly 2k - 1 dots; after k layers the count is k².
const beautyTrigger = document.querySelector('.beauty-trigger');
const beautyDialog = document.querySelector('.beauty-dialog');
const proofGrid = document.querySelector('.beauty-grid');
const proofSlider = document.getElementById('square-size');
const proofOutput = document.getElementById('square-size-value');
const proofEquation = document.querySelector('.beauty-equation');
const proofLayerText = document.querySelector('.beauty-layer');
const proofAnnouncement = document.querySelector('.beauty-announcement');
const proofColors = ['#b4c8ff','#7fa7ff','#71c7ed','#79dcc7','#b4e18b','#e5dc91','#f2bd90','#eaa4b7','#cba7ee','#a7b3ff'];
let proofTimer = null;
let proofSize = 6;
let proofStep = 0;
let previousOverflow = '';
let proofInputFrame = null;
let proofDots = [];
let builtProofSize = 0;
function stopProof() { clearTimeout(proofTimer); proofTimer = null; }
function showProofStep(k) {
  k = Math.max(1, Math.min(proofSize, k));
  proofStep = k;
  proofDots.forEach(dot => dot.classList.toggle('lit', Number(dot.dataset.layer) <= k));
  proofEquation.replaceChildren();
  for (let i = 1; i <= k; i++) {
    if (k > 5 && i > 2 && i < k) {
      if (i === 3) { const dots = document.createElement('span'); dots.className = 'proof-plus'; dots.textContent = '+ ⋯'; proofEquation.append(dots); }
      continue;
    }
    if (i > 1) { const plus = document.createElement('span'); plus.className = 'proof-plus'; plus.textContent = '+'; proofEquation.append(plus); }
    const term = document.createElement('span'); term.textContent = String(2 * i - 1); term.style.color = proofColors[i - 1]; proofEquation.append(term);
  }
  const total = document.createElement('span'); total.className = 'proof-total'; total.textContent = ` = ${k}² = ${k * k}`; proofEquation.append(total);
  proofLayerText.textContent = k === 1 ? 'One dot. The first square.' : `Layer ${k}: ${2 * k - 1} new dots. A ${k} × ${k} square.`;
  proofGrid.setAttribute('aria-label', `${k * k} illuminated dots forming a ${k} by ${k} square; ${k} of ${proofSize} layers complete.`);
  document.querySelector('.beauty-dimension').textContent = `${k} × ${k}`;
  if (k === proofSize) proofAnnouncement.textContent = `Complete: the first ${k} odd numbers add to ${k * k}, forming a ${k} by ${k} square.`;
}
function buildProof(animate = true) {
  stopProof();
  if (proofInputFrame !== null) { cancelAnimationFrame(proofInputFrame); proofInputFrame = null; }
  proofSize = Math.max(1, Math.min(10, Math.round(Number(proofSlider.value) || 1)));
  proofOutput.textContent = `${proofSize} × ${proofSize}`;
  proofSlider.setAttribute('aria-valuetext', `${proofSize} by ${proofSize} square`);
  proofGrid.style.setProperty('--n', proofSize);
  proofAnnouncement.textContent = '';
  if (builtProofSize !== proofSize) {
  const fragment = document.createDocumentFragment();
  proofDots = [];
  for (let row = 0; row < proofSize; row++) {
    for (let col = 0; col < proofSize; col++) {
      const layer = Math.max(row, col) + 1;
      const dot = document.createElement('span'); dot.className = 'proof-dot'; dot.dataset.layer = layer;
      dot.setAttribute('aria-hidden','true'); dot.style.setProperty('--dot-color',proofColors[layer - 1]); fragment.append(dot); proofDots.push(dot);
    }
  }
  proofGrid.replaceChildren(fragment);
  builtProofSize = proofSize;
  }
  if (reduced || !animate) { showProofStep(proofSize); return; }
  showProofStep(1);
  const advance = () => {
    if (!beautyDialog.open) return;
    if (reduced) { showProofStep(proofSize); return; }
    showProofStep(proofStep + 1);
    if (proofStep < proofSize) proofTimer = setTimeout(advance, 650);
  };
  if (proofSize > 1) proofTimer = setTimeout(advance, 650);
}
if (beautyTrigger && beautyDialog && typeof beautyDialog.showModal === 'function') {
  beautyTrigger.hidden = false;
  beautyTrigger.addEventListener('click', () => {
    if (beautyDialog.open) return;
    previousOverflow = document.body.style.overflow;
    beautyDialog.showModal(); document.body.style.overflow = 'hidden';
    buildProof();
  });
  beautyDialog.querySelector('.beauty-close').addEventListener('click', () => beautyDialog.close());
  beautyDialog.addEventListener('close', () => {
    stopProof();
    if (proofInputFrame !== null) { cancelAnimationFrame(proofInputFrame); proofInputFrame = null; }
    document.body.style.overflow = previousOverflow; beautyTrigger.focus({preventScroll:true});
  });
  let backdropStart = false;
  const outsideDialog = event => {
    const rect = beautyDialog.getBoundingClientRect();
    return event.target === beautyDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  beautyDialog.addEventListener('pointerdown', event => { backdropStart = outsideDialog(event); });
  beautyDialog.addEventListener('click', event => {
    if (backdropStart && outsideDialog(event)) beautyDialog.close();
    backdropStart = false;
  });
  proofSlider.addEventListener('input', () => {
    stopProof();
    if (proofInputFrame === null) proofInputFrame = requestAnimationFrame(() => { proofInputFrame = null; buildProof(false); });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && beautyDialog.open) { stopProof(); showProofStep(proofSize); }
  });
  document.querySelector('.beauty-replay').addEventListener('click', () => buildProof());
  new MutationObserver(() => {
    if (reduced && beautyDialog.open) { stopProof(); showProofStep(proofSize); }
  }).observe(root, {attributes:true,attributeFilter:['data-reduced-motion']});
}

// Scroll-only work: no continuous animation loop and no interception of scrolling.
(() => {
  const work = document.getElementById('work');
  if (!work) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.classList.add('scroll-wave');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  const track = document.createElementNS(ns, 'path'); track.classList.add('scroll-wave-track');
  const line = document.createElementNS(ns, 'path'); line.classList.add('scroll-wave-line');
  const tip = document.createElementNS(ns, 'circle'); tip.classList.add('scroll-wave-tip'); tip.setAttribute('r','2.7');
  svg.append(track,line,tip); work.prepend(svg); work.classList.add('scroll-effects');
  const previews = [...work.querySelectorAll('.project-art, .papers-title')].map((element,index) => {
    element.dataset.scrollPreview = '';
    return {element,visual:element.closest('.project-visual'),sign:index%2 ? -1 : 1};
  });
  let pending = false, length = 1, curveHeight = 0;
  const clamp = value => Math.max(0, Math.min(1,value));
  function rebuild() {
    curveHeight = Math.max(1,work.offsetHeight);
    const w = innerWidth <= 700 ? 12 : 28;
    const amplitude = w * .32;
    const commands = [];
    for(let y=0;y<=curveHeight;y+=3) commands.push(`${y===0?'M':'L'}${(w/2 + amplitude*Math.sin(y/260*Math.PI*2)).toFixed(2)},${y}`);
    commands.push(`L${(w/2 + amplitude*Math.sin(curveHeight/260*Math.PI*2)).toFixed(2)},${curveHeight}`);
    svg.setAttribute('viewBox',`0 0 ${w} ${curveHeight}`);
    track.setAttribute('d',commands.join(' ')); line.setAttribute('d',commands.join(' '));
    length = line.getTotalLength(); line.style.strokeDasharray = String(length);
    schedule();
  }
  function update() {
    pending = false;
    const still = root.dataset.reducedMotion === 'true';
    const bounds = work.getBoundingClientRect();
    const fraction = still ? 1 : clamp((innerHeight*.7-bounds.top)/curveHeight);
    line.style.strokeDashoffset = String(length*(1-fraction));
    const position = line.getPointAtLength(length*fraction);
    tip.setAttribute('cx',position.x); tip.setAttribute('cy',position.y);
    tip.style.opacity = fraction>0 && fraction<1 ? '1':'0';
    for(const {element,visual,sign} of previews) {
      const p = still ? 1 : clamp((innerHeight*.94-visual.getBoundingClientRect().top)/(innerHeight*.72));
      const remaining = Math.pow(1-p,3);
      element.style.setProperty('--settle-y',`${(remaining*16).toFixed(2)}px`);
      element.style.setProperty('--settle-x',`${(remaining*7).toFixed(3)}deg`);
      element.style.setProperty('--settle-z',`${(remaining*2.2*sign).toFixed(3)}deg`);
    }
  }
  function schedule() { if(!pending) {pending=true;requestAnimationFrame(update);} }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',rebuild);
  new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-reduced-motion']});
  if('ResizeObserver' in window) new ResizeObserver(rebuild).observe(work);
  document.fonts?.ready.then(rebuild);
  rebuild();
})();

// A small, eased movement confined to the hero; idle frames cost nothing.
(() => {
  const hero = document.querySelector('.hero');
  const title = document.getElementById('hero-title');
  if (!hero || !title) return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let x = 0, y = 0, targetX = 0, targetY = 0, raf = null, last = 0;
  const enabled = () => root.dataset.reducedMotion !== 'true' && !title.classList.contains('headline-active') && !document.hidden;
  function paint() {
    title.style.setProperty('--headline-x', `${x.toFixed(3)}px`);
    title.style.setProperty('--headline-y', `${y.toFixed(3)}px`);
  }
  function step(now) {
    const dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    const ease = 1 - Math.exp(-dt / 110);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    if (Math.abs(targetX - x) + Math.abs(targetY - y) < .02) {
      x = targetX; y = targetY; raf = null; last = 0; paint(); return;
    }
    paint(); raf = requestAnimationFrame(step);
  }
  function schedule() { if (raf === null) raf = requestAnimationFrame(step); }
  function reset(instant = false) {
    targetX = targetY = 0;
    if (instant) {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null; last = 0; x = y = 0; paint();
    } else schedule();
  }
  function followPointer(event) {
    if (!enabled() || (event.pointerType !== 'touch' && !finePointer.matches)) return;
    const box = hero.getBoundingClientRect();
    const clamp = n => Math.max(-1, Math.min(1, n));
    const touch = event.pointerType === 'touch';
    targetX = clamp((event.clientX - box.left) / box.width * 2 - 1) * (touch ? 5 : 9);
    targetY = clamp((event.clientY - box.top) / box.height * 2 - 1) * (touch ? 3 : 6);
    schedule();
  }
  function followScroll() {
    if (finePointer.matches) { reset(); return; }
    if (!enabled()) { reset(true); return; }
    const box = hero.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= innerHeight) { reset(true); return; }
    targetX = 0;
    targetY = Math.max(-7, Math.min(7, (hero.offsetTop - box.top) * .014));
    schedule();
  }
  hero.addEventListener('pointermove', followPointer, {passive:true});
  hero.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') followPointer(event); }, {passive:true});
  hero.addEventListener('pointerup', event => { if (event.pointerType === 'touch') followScroll(); }, {passive:true});
  hero.addEventListener('pointercancel', followScroll, {passive:true});
  hero.addEventListener('pointerleave', () => { if (finePointer.matches) reset(); });
  window.addEventListener('blur', () => reset(true));
  window.addEventListener('resize', () => reset(true));
  window.addEventListener('scroll', followScroll, {passive:true});
  document.addEventListener('visibilitychange', () => reset(true));
  finePointer.addEventListener('change', () => reset(true));
  new MutationObserver(() => { if (!enabled()) reset(true); }).observe(root, {attributes:true, attributeFilter:['data-reduced-motion']});
  new MutationObserver(() => { if (!enabled()) reset(true); }).observe(title, {attributes:true, attributeFilter:['class']});
})();

// An original city, projected from above. No image downloads or 3D dependencies.
(() => {
  const hero = document.querySelector('.hero');
  const canvas = hero?.querySelector('.aerial-city');
  const skip = hero?.querySelector('.aerial-skip');
  const context = canvas?.getContext('2d');
  if (!hero || !context || !skip) return;
  const visitKey = 'portfolio-aerial-intro-v1';
  let visited = false;
  try { visited = sessionStorage.getItem(visitKey) === 'seen'; } catch {}
  const still = () => root.dataset.reducedMotion === 'true';
  let width = 0, height = 0, frame = null, resizeFrame = null;
  let started = 0, lastPaint = 0, playing = false, progress = 1;
  let buildings = [], streets = [];
  let seed = 8237;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function createCity() {
    seed = 8237; buildings = []; streets = [];
    const count = width < 600 ? 7 : 9;
    const extent = count * 9 + 6;
    for (let n = -count; n <= count; n++) {
      const p = n * 9;
      streets.push([[-extent,0,p-.48],[extent,0,p-.48],[extent,0,p+.48],[-extent,0,p+.48]]);
      streets.push([[p-.48,0,-extent],[p+.48,0,-extent],[p+.48,0,extent],[p-.48,0,extent]]);
    }
    for (let row = -count; row < count; row++) {
      for (let col = -count; col < count; col++) {
        const x = col * 9 + 1.5, z = row * 9 + 1.5;
        const bw = 3.7 + random() * 2.2, bd = 3.7 + random() * 2.2;
        const bh = .8 + random() * 4.3;
        const shade = random();
        // A little square around the person is kept open as the camera descends.
        if ((Math.abs(x + bw / 2) < 9 && Math.abs(z + bd / 2) < 9) || shade < .09) continue;
        buildings.push({x,z,w:bw,d:bd,h:bh,shade});
      }
    }
    buildings.sort((a,b) => a.z - b.z);
  }
  function draw(p) {
    if (!width || !height) return;
    progress = p;
    const eased = p * p * (3 - 2 * p);
    const altitude = width < 600 ? 130 : 210;
    const distance = altitude * Math.pow(32 / altitude, eased);
    const elevation = 1.51 - .29 * eased;
    const sin = Math.sin(elevation), cos = Math.cos(elevation);
    const focal = Math.min(width, height) * .95;
    const centerX = width * (width < 600 ? .8 : .64), centerY = height * .74;
    const project = ([x,y,z]) => {
      const depth = distance - y * sin - z * cos;
      if (depth < 4) return null;
      return [centerX + x * focal / depth, centerY - (y * cos - z * sin) * focal / depth];
    };
    const polygon = (vertices, fill, stroke) => {
      const points = vertices.map(project);
      if (points.some(point => !point)) return;
      if (points.every(([x])=>x < -40) || points.every(([x])=>x > width + 40) || points.every(([,y])=>y < -40) || points.every(([,y])=>y > height + 40)) return;
      context.beginPath(); context.moveTo(...points[0]);
      for (let i=1;i<points.length;i++) context.lineTo(...points[i]);
      context.closePath(); context.fillStyle = fill; context.fill();
      if (stroke) { context.strokeStyle = stroke; context.lineWidth = .65; context.stroke(); }
    };
    context.clearRect(0,0,width,height);
    const glow = context.createRadialGradient(centerX,centerY,0,centerX,centerY,Math.max(width,height)*.53);
    glow.addColorStop(0,'rgba(53,96,172,.16)'); glow.addColorStop(1,'rgba(20,35,60,0)');
    context.fillStyle = glow; context.fillRect(0,0,width,height);
    for (const street of streets) polygon(street,'rgba(156,185,221,.075)','rgba(179,205,237,.055)');
    for (const b of buildings) {
      const {x,z,w,d,h,shade} = b;
      const a=[x,0,z], bb=[x+w,0,z], c=[x+w,0,z+d], dd=[x,0,z+d];
      const A=[x,h,z], B=[x+w,h,z], C=[x+w,h,z+d], D=[x,h,z+d];
      polygon([bb,c,C,B],'#101c2c','rgba(161,190,229,.09)');
      polygon([dd,c,C,D],'#152338','rgba(161,190,229,.09)');
      polygon([A,B,C,D],shade > .6 ? '#293e59' : '#1c2e45','rgba(194,215,241,.19)');
      // Small rooftop outlines become visible naturally as the camera gets closer.
      if (p > .18 && w > 4.5) polygon([[x+.8,h+.04,z+.8],[x+w-.8,h+.04,z+.8],[x+w-.8,h+.04,z+d-.8],[x+.8,h+.04,z+d-.8]],'#1b2b40','rgba(177,200,231,.1)');
    }
    const origin = project([0,0,0]);
    const scale = focal / distance;
    const radius = Math.max(3,scale * .8);
    const beacon = context.createRadialGradient(...origin,0,...origin,radius*5);
    beacon.addColorStop(0,'rgba(113,162,255,.4)'); beacon.addColorStop(1,'rgba(91,143,255,0)');
    context.fillStyle = beacon; context.beginPath(); context.arc(...origin,radius*5,0,Math.PI*2); context.fill();
    context.strokeStyle = 'rgba(139,178,255,.55)'; context.lineWidth = 1;
    context.beginPath(); context.ellipse(origin[0],origin[1],radius*1.6,radius*1.6*sin,0,0,Math.PI*2); context.stroke();
    const body = project([0,.55,0]), head = project([0,1.3,0]);
    context.fillStyle = '#bfd5ff'; context.beginPath(); context.arc(head[0],head[1],Math.max(1.4,scale*.15),0,Math.PI*2); context.fill();
    context.strokeStyle = '#95b9ff'; context.lineWidth = Math.max(1.3,scale*.2); context.lineCap = 'round';
    context.beginPath();context.moveTo(head[0],head[1]+scale*.18);context.lineTo(body[0],body[1]);context.stroke();
    for (const dx of [-.2,.2]) {
      const foot = project([dx,.04,.1]);
      context.beginPath();context.moveTo(...body);context.lineTo(...foot);context.stroke();
    }
  }
  function finish() {
    playing = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; hero.dataset.aerialState = 'settled'; skip.hidden = true;
    draw(1);
  }
  function tick(time) {
    frame = null;
    if (!playing) return;
    if (still() || document.hidden) { finish(); return; }
    if (!started) started = time;
    const duration = width < 600 ? 2700 : 3300;
    const p = Math.min(1,(time-started)/duration);
    if (width >= 600 || time-lastPaint >= 32 || p === 1) { draw(p); lastPaint = time; }
    if (p === 1) finish(); else frame = requestAnimationFrame(tick);
  }
  function resize() {
    width = hero.clientWidth; height = hero.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, width < 600 ? 1.5 : 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    createCity(); draw(progress);
  }
  // Returning from a project or following a section link goes straight to the hero.
  const shouldPlay = !visited && !still() && !location.hash && !document.hidden;
  progress = shouldPlay ? 0 : 1;
  resize();
  if (shouldPlay) {
    try { sessionStorage.setItem(visitKey,'seen'); } catch {}
    playing = true; hero.dataset.aerialState = 'playing'; skip.hidden = false;
    frame = requestAnimationFrame(tick);
  } else finish();
  skip.addEventListener('click', () => {
    // Leave keyboard focus at the content instead of on a newly hidden button.
    if (document.activeElement === skip) {
      const title = document.getElementById('hero-title');
      title.setAttribute('tabindex','-1'); title.focus({preventScroll:true});
      title.addEventListener('blur',()=>title.removeAttribute('tabindex'),{once:true});
    }
    finish();
  });
  window.addEventListener('scroll',()=>{if(playing && scrollY > 80) finish();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && playing) finish();});
  new MutationObserver(()=>{if(still()) finish();}).observe(root,{attributes:true,attributeFilter:['data-reduced-motion']});
  if ('ResizeObserver' in window) new ResizeObserver(()=>{
    if (resizeFrame === null) resizeFrame = requestAnimationFrame(()=>{resizeFrame=null;resize();});
  }).observe(hero);
})();
