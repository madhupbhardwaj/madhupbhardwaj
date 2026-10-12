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

// The dock follows the chapter in view; anchors remain fully usable without JS.
(() => {
  const dock = document.querySelector('.section-dock');
  if (!dock) return;
  const items = [...dock.querySelectorAll('a[href^="#"]')].map(link => ({
    link, section: document.getElementById(link.getAttribute('href').slice(1))
  })).filter(item => item.section);
  let frame = null;
  let selected = items.find(item => item.link.getAttribute('href') === location.hash) || null;
  function update() {
    frame = null;
    const available = items.filter(item => item.section.getClientRects().length > 0);
    for (const item of items) item.link.hidden = !available.includes(item);
    dock.style.setProperty('--dock-count',String(available.length));
    const line = Math.min(innerHeight * .3, 210);
    let active = null;
    for (const item of available) if (item.section.getBoundingClientRect().top <= line) active = item;
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 8) active = available.at(-1);
    if (selected && available.includes(selected)) {
      const rect = selected.section.getBoundingClientRect();
      if (rect.bottom > 85 && rect.top < innerHeight - 80) active = selected;
    }
    for (const item of items) {
      if (item === active) item.link.setAttribute('aria-current','location');
      else item.link.removeAttribute('aria-current');
    }
  }
  function schedule() { if (frame === null) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  dock.addEventListener('click',event => {
    const link = event.target.closest('a');
    if (link) { selected = items.find(item => item.link === link) || null; schedule(); }
  });
  window.addEventListener('hashchange',()=>{ selected=items.find(item=>item.link.getAttribute('href')===location.hash)||null; schedule(); });
  const followReading = () => { selected=null; schedule(); };
  window.addEventListener('wheel',followReading,{passive:true});
  window.addEventListener('touchmove',followReading,{passive:true});
  window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) followReading();});
  document.fonts?.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.getElementById('main'));
  update();
})();

// A visual boot sequence; page access never depends on the intro finishing.
(() => {
  const screen = document.querySelector('.boot-screen');
  const replay = document.querySelector('.boot-replay');
  if (!screen || typeof screen.showModal !== 'function') {
    root.classList.remove('boot-pending'); return;
  }
  const key = 'portfolio-boot-intro-v1';
  const log = screen.querySelector('.boot-log');
  const counter = screen.querySelector('.boot-count');
  const meter = screen.querySelector('.boot-progress');
  const fill = meter.querySelector('span');
  const skip = screen.querySelector('.boot-skip');
  let frame = null, exitTimer = null, safetyTimer = null, started = 0, running = false;
  let typographyReady = document.fonts?.status !== 'loading';
  let previousFocus = null;
  document.fonts?.ready.then(()=>{ typographyReady=true; });
  const steps = [
    {at:0, label:'opening notebook'},
    {at:.12, label:`project index · ${document.querySelectorAll('#work .project').length} entries`,ok:true},
    {at:.3, label:`bookshelf · ${document.querySelectorAll('.shelf-book').length} volumes`,ok:true},
    {at:.47, label:'mathematical experiments',ok:true},
    {at:.64, label:'motion preferences restored',ok:true},
    {at:.82, label:'curiosity ready',ok:true}
  ];
  let rows=[];
  function paint(amount) {
    const percent = Math.min(100,Math.floor(amount*100));
    counter.textContent=`${String(percent).padStart(3,'0')}%`;
    meter.setAttribute('aria-valuenow',String(percent));
    fill.style.transform=`scaleX(${amount})`;
    rows.forEach((row,i)=>row.classList.toggle('is-ready',amount>=steps[i].at));
  }
  function cleanup() {
    running=false;
    if(frame!==null) cancelAnimationFrame(frame);
    frame=null;clearTimeout(exitTimer);clearTimeout(safetyTimer);
    exitTimer=safetyTimer=null;
    root.classList.remove('boot-pending','boot-active');
    screen.classList.remove('boot-finishing');
  }
  function finish(instant=false) {
    if(!screen.open){cleanup();return;}
    if(!running && exitTimer!==null && !instant) return;
    running=false;
    if(frame!==null) cancelAnimationFrame(frame);
    frame=null;clearTimeout(safetyTimer);clearTimeout(exitTimer);paint(1);
    const close=()=>{
      screen.close();cleanup();
      if(previousFocus?.isConnected && previousFocus!==document.body && previousFocus!==skip) previousFocus.focus({preventScroll:true});
    };
    if(instant || root.dataset.reducedMotion==='true') close();
    else{screen.classList.add('boot-finishing');exitTimer=setTimeout(close,200);}
  }
  function tick(now) {
    frame=null;if(!running) return;
    if(root.dataset.reducedMotion==='true' || document.hidden){finish(true);return;}
    const p=Math.min(1,(now-started)/2200);
    paint(typographyReady?p:Math.min(.94,p));
    if(p===1 && typographyReady) finish();
    else frame=requestAnimationFrame(tick);
  }
  function updateReplay() {
    replay.hidden=false;
    replay.disabled=root.dataset.reducedMotion==='true';
    replay.title=replay.disabled?'Enable motion to replay the intro':'Replay the portfolio intro';
  }
  function start() {
    if(root.dataset.reducedMotion==='true' || screen.open) return;
    previousFocus=document.activeElement;
    log.replaceChildren();
    rows=steps.map(step=>{
      const row=document.createElement('div');row.className='boot-line';
      const time=document.createElement('span');time.className='boot-time';time.textContent=`[${(step.at*2.2).toFixed(3)}]`;
      const text=document.createElement('span');
      if(step.ok){const ok=document.createElement('span');ok.className='boot-ok';ok.textContent='OK';text.append(ok);}
      text.append(document.createTextNode(step.label));row.append(time,text);log.append(row);return row;
    });
    try{screen.showModal();}catch{cleanup();return;}
    try{sessionStorage.setItem(key,'seen');}catch{}
    root.classList.add('boot-active');root.classList.remove('boot-pending');
    screen.classList.remove('boot-finishing');skip.focus({preventScroll:true});running=true;started=performance.now();paint(0);
    // This also releases the page if a font or rendering task stalls.
    safetyTimer=setTimeout(()=>finish(true),3400);
    frame=requestAnimationFrame(tick);
  }
  skip.addEventListener('click',()=>finish());
  screen.addEventListener('cancel',event=>{event.preventDefault();finish(true);});
  screen.addEventListener('close',cleanup);
  replay.addEventListener('click',start);
  document.addEventListener('visibilitychange',()=>{if(document.hidden && screen.open) finish(true);});
  new MutationObserver(()=>{updateReplay();if(root.dataset.reducedMotion==='true') finish(true);}).observe(root,{attributes:true,attributeFilter:['data-reduced-motion']});
  updateReplay();let seen=false;
  try{seen=sessionStorage.getItem(key)==='seen';}catch{}
  if(!seen && !location.hash && !document.hidden && root.dataset.reducedMotion!=='true') start();
  else root.classList.remove('boot-pending');
})();
