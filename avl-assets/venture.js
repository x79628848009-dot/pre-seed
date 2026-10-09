(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let explicit = null;
  try { explicit = localStorage.getItem('avl-motion'); } catch (_) {}
  let motionOff = reduced.matches || explicit === 'off';
  const animations = new Set();
  function syncMotion() {
    document.documentElement.classList.toggle('motion-off', motionOff);
    if (motionOff) { animations.forEach(animation => animation.finish()); animations.clear(); }
  }
  syncMotion();
  const onPreference = () => { motionOff = reduced.matches || explicit === 'off'; syncMotion(); };
  if (reduced.addEventListener) reduced.addEventListener('change', onPreference);
  if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (motionOff) return;
        const animation = entry.target.animate([
          { opacity: 0.25, transform: 'translateY(22px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 850, easing: 'cubic-bezier(.16,1,.3,1)' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
  }
})();
