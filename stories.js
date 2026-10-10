const motionButton = document.querySelector('.motion-toggle');
const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion = null;
try { savedMotion = localStorage.getItem('portfolio-reduced-motion'); } catch {}
let reduceMotion = savedMotion === null ? motionMedia.matches : savedMotion === 'true';

// Native details remain usable if JavaScript is unavailable.
const stories = Array.from(document.querySelectorAll('.story-drawer'), drawer => {
  const summary = drawer.querySelector('summary');
  const content = drawer.querySelector('.story-inner');
  content.id = `${drawer.id}-content`;
  summary.setAttribute('aria-controls', content.id);
  const story = { drawer, summary, content, expanded: drawer.open, animation: null, fade: null };
  return story;
});

function setState(story, expanded) {
  story.expanded = expanded;
  story.drawer.dataset.expanded = String(expanded);
  story.summary.setAttribute('aria-expanded', String(expanded));
  story.content.inert = !expanded;
}

function settle(story) {
  // Clear handlers before cancellation so rapid taps cannot finish an old transition.
  if (story.animation) story.animation.onfinish = null;
  story.animation?.cancel();
  story.fade?.cancel();
  story.animation = null;
  story.fade = null;
  story.drawer.open = story.expanded;
  story.drawer.style.removeProperty('height');
  story.drawer.classList.remove('is-animating');
}

function expand(story, expanded, animate = true, keepVisible = false) {
  if (story.expanded === expanded && !story.animation) return;
  const { drawer, summary, content } = story;
  const startHeight = drawer.getBoundingClientRect().height;
  const startOpacity = drawer.open ? getComputedStyle(content).opacity : '0';
  const startTransform = drawer.open ? getComputedStyle(content).transform : 'translateY(-8px)';
  const startScroll = window.scrollY;
  if (!expanded && content.contains(document.activeElement)) summary.focus({ preventScroll: true });
  setState(story, expanded);
  if (story.animation) story.animation.onfinish = null;
  story.animation?.cancel();
  story.fade?.cancel();
  drawer.style.removeProperty('height');
  // Measure the real responsive layout, rather than guessing a maximum height.
  drawer.open = expanded;
  const endHeight = drawer.getBoundingClientRect().height;
  drawer.open = true;
  if (!animate || reduceMotion || typeof drawer.animate !== 'function' || Math.abs(endHeight - startHeight) < 1) {
    settle(story);
    return;
  }
  drawer.classList.add('is-animating');
  const duration = expanded ? 420 : 340;
  const easing = 'cubic-bezier(.22, 1, .36, 1)';
  story.animation = drawer.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], { duration, easing, fill: 'both' });
  story.fade = content.animate([
    { opacity: startOpacity, transform: startTransform },
    { opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(0)' : 'translateY(-8px)' }
  ], { duration: expanded ? 320 : 220, easing, fill: 'both' });
  story.animation.onfinish = () => {
    settle(story);
    // A tall preceding story can move the chosen heading above the phone screen.
    // Keep it in view only if the reader has not scrolled during the animation.
    if (keepVisible && expanded && Math.abs(window.scrollY - startScroll) < 4) {
      const rect = summary.getBoundingClientRect();
      if (rect.top < 12 || rect.bottom > window.innerHeight) summary.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'instant' : 'smooth' });
    }
  };
}

function selectStory(selected, animate = true, keepVisible = false) {
  stories.forEach(story => expand(story, story === selected, animate, keepVisible && story === selected));
  if (selected && keepVisible && (reduceMotion || !animate)) {
    const rect = selected.summary.getBoundingClientRect();
    if (rect.top < 12 || rect.bottom > window.innerHeight) selected.summary.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}

stories.forEach(story => {
  setState(story, story.expanded);
  // A summary emits click for touch, mouse, Enter and Space.
  story.summary.addEventListener('click', event => {
    event.preventDefault();
    selectStory(story.expanded ? null : story, true, true);
  });
});

function updateMotion() {
  document.documentElement.dataset.reducedMotion = String(reduceMotion);
  motionButton?.setAttribute('aria-pressed', String(reduceMotion));
  const label = reduceMotion ? 'Reduced motion on; enable motion' : 'Reduce motion';
  motionButton?.setAttribute('aria-label', label);
  if (motionButton) motionButton.title = label;
  if (reduceMotion) stories.forEach(settle);
}
motionButton?.addEventListener('click', () => {
  reduceMotion = !reduceMotion;
  savedMotion = String(reduceMotion);
  try { localStorage.setItem('portfolio-reduced-motion', savedMotion); } catch {}
  updateMotion();
});
motionMedia.addEventListener('change', event => {
  if (savedMotion === null) { reduceMotion = event.matches; updateMotion(); }
});
updateMotion();

function openLinkedStory(animate = false) {
  const selected = stories.find(story => story.drawer.id === location.hash.slice(1));
  if (selected) selectStory(selected, animate, true);
}
window.addEventListener('hashchange', () => openLinkedStory(true));
window.addEventListener('resize', () => stories.forEach(settle));
// Normalize the initial state, including links from each homepage project card.
selectStory(stories.find(story => story.expanded) || null, false);
openLinkedStory();
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
