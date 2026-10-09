(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let explicit = null;
  try { explicit = localStorage.getItem('avl-motion'); } catch (_) {}
  let motionOff = explicit === 'off' || (explicit !== 'on' && reduced.matches);
  const animations = new Set();
  function syncMotion() {
    document.documentElement.classList.toggle('motion-off', motionOff);
    document.querySelectorAll('.motion-toggle').forEach(button => {
      button.textContent = motionOff ? 'Включить движение' : 'Отключить движение';
    });
    if (motionOff) { animations.forEach(animation => animation.finish()); animations.clear(); }
  }
  syncMotion();
  document.querySelectorAll('.motion-toggle').forEach(button => button.addEventListener('click', () => {
    motionOff = !motionOff; explicit = motionOff ? 'off' : 'on';
    try { localStorage.setItem('avl-motion', explicit); } catch (_) {}
    syncMotion();
  }));
  const onPreference = () => { if (explicit === null) { motionOff = reduced.matches; syncMotion(); } };
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
