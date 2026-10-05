const motionButton = document.querySelector('.motion-toggle');
const motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion = null;
try { savedMotion = localStorage.getItem('portfolio-reduced-motion'); } catch {}
let reduceMotion = savedMotion === null ? motionMedia.matches : savedMotion === 'true';

function updateMotion() {
  document.documentElement.dataset.reducedMotion = String(reduceMotion);
  motionButton.setAttribute('aria-pressed', String(reduceMotion));
  const label = reduceMotion ? 'Reduced motion on; enable motion' : 'Reduce motion';
  motionButton.setAttribute('aria-label', label);
  motionButton.title = label;
}
motionButton.addEventListener('click', () => {
  reduceMotion = !reduceMotion;
  savedMotion = String(reduceMotion);
  try { localStorage.setItem('portfolio-reduced-motion', savedMotion); } catch {}
  updateMotion();
});
motionMedia.addEventListener('change', event => {
  if (savedMotion === null) { reduceMotion = event.matches; updateMotion(); }
});
updateMotion();

// Deep links from the homepage open the right drawer automatically.
function openLinkedStory() {
  const id = location.hash.slice(1);
  const drawer = document.getElementById(id);
  if (drawer?.matches('.story-drawer')) drawer.open = true;
}
window.addEventListener('hashchange', openLinkedStory);
openLinkedStory();
document.getElementById('year').textContent = new Date().getFullYear();
