'use strict';

// Progressive enhancement: all content remains visible if scripting is unavailable.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const readingProgress = document.getElementById('readingProgress');
let progressFrame = 0;
function updateReadingProgress() {
  progressFrame = 0;
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  readingProgress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
}
function scheduleProgress() {
  if (!progressFrame) progressFrame = requestAnimationFrame(updateReadingProgress);
}
window.addEventListener('scroll', scheduleProgress, { passive: true });
window.addEventListener('resize', scheduleProgress);
window.addEventListener('load', scheduleProgress);
window.addEventListener('portfolio:pagechange', scheduleProgress);
updateReadingProgress();

let revealObserver;
function setupReveals() {
  revealObserver?.disconnect();
  document.querySelectorAll('.reveal-pending').forEach(node => node.classList.remove('reveal-pending'));
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      entry.target.classList.add('reveal-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.selected-work, .service, .testimonials, .working-together, .conversation-banner, .skills-category').forEach(node => {
    // Hidden tabs are left intact and reconsidered when activated.
    if (!node.getClientRects().length || node.getBoundingClientRect().top < window.innerHeight) return;
    node.classList.add('reveal-pending');
    revealObserver.observe(node);
  });
}
motionPreference.addEventListener('change', setupReveals);
window.addEventListener('portfolio:pagechange', setupReveals);
setupReveals();

// Let visitors control continuous logo movement.
const clientTrack = document.querySelector('.clients-marquee-track');
if (clientTrack) {
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'motion-toggle';
  let paused = true;
  function syncMotion() {
    clientTrack.style.animationPlayState = paused || motionPreference.matches ? 'paused' : 'running';
    pause.textContent = paused ? 'Play client showcase →' : 'Pause client showcase Ⅱ';
    pause.setAttribute('aria-pressed', String(!paused));
    pause.hidden = motionPreference.matches;
  }
  pause.addEventListener('click', () => { paused = !paused; syncMotion(); });
  clientTrack.parentElement.after(pause);
  motionPreference.addEventListener('change', syncMotion);
  syncMotion();
}

// Escape closes the mobile category menu; clicks outside dismiss it as well.
if (select) {
  const syncSelect = () => select.setAttribute('aria-expanded', String(select.classList.contains('active')));
  select.addEventListener('click', syncSelect);
  document.addEventListener('click', event => {
    if (!event.target.closest('.filter-select-box')) select.classList.remove('active');
    syncSelect();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && select.classList.contains('active')) {
      select.classList.remove('active'); syncSelect(); select.focus();
    }
  });
  syncSelect();
}
