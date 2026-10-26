(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.getElementById('progress');
  const glow = document.getElementById('cursorGlow');
  const portrait = document.getElementById('portrait');
  const sideLinks = [...document.querySelectorAll('.side-index a')];
  const sections = ['top','universe','identity','archive','creator','projectsSection','gallery','links'].map(id => document.getElementById(id)).filter(Boolean);
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
    let active = 0;
    sections.forEach((section, i) => { if (section.getBoundingClientRect().top <= innerHeight * .42) active = i; });
    sideLinks.forEach((a, i) => a.classList.toggle('active', i === active));
  };
  addEventListener('scroll', updateScroll, { passive: true }); updateScroll();
  const revealNodes = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    revealNodes.forEach((node, i) => { node.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; observer.observe(node); });
  } else revealNodes.forEach(node => node.classList.add('visible'));
  if (!reduced && matchMedia('(pointer:fine)').matches) {
    let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; if (glow) { glow.style.left = `${mx}px`; glow.style.top = `${my}px`; } });
    const animate = () => { gx += (mx - gx) * .08; gy += (my - gy) * .08; if (glow) { glow.style.left = `${gx}px`; glow.style.top = `${gy}px`; } requestAnimationFrame(animate); };
    if (glow) animate();
    const visual = document.getElementById('heroVisual');
    if (visual && portrait) visual.addEventListener('mousemove', e => {
      const r = visual.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5; const y = (e.clientY - r.top) / r.height - .5;
      portrait.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
    });
    if (visual && portrait) visual.addEventListener('mouseleave', () => { portrait.style.transform = ''; });
  }
  // Easter egg: type E G O in sequence to reveal a short archive signal.
  let typed = '';
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.target.matches('input,textarea')) return;
    typed = (typed + e.key.toLowerCase()).slice(-3);
    if (typed === 'ego') {
      const toast = document.getElementById('toast');
      if (toast) { toast.textContent = 'SIGNAL FOUND / KEEP EVOLVING.'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
      typed = '';
    }
  });
})();
