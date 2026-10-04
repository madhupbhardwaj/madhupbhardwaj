const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
document.getElementById('year').textContent = new Date().getFullYear();
const progress = document.querySelector('.progress');
let scheduled = false;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) {scheduled = true; requestAnimationFrame(updateProgress);}
}, {passive:true});
window.addEventListener('resize', updateProgress);
updateProgress();
