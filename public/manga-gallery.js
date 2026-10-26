(() => {
  const files = [
    '095196c5bd87699a0fe60825a999434c.jpg',
    '0b545b169031945.Y3JvcCw4MzUsNjUzLDAsMA.jpg',
    '5t3zftxrtkie1.jpg',
    '8im9dvz4tv2e1.jpg',
    'images (1).jpg',
    'images (2).jpg',
    'images (3).jpg',
    'images.jpg',
    'isagis-flow-v0-hpd1rrbrx4zd1.jpg',
    'qdod4a2ay74c1.jpg',
    'rakood8pciqb1.jpg',
    'tell-me-the-best-quote-from-every-character-day-.jpg',
    'w7g36sjkow5c1.jpg'
  ];
  const titles = ['EGO / INSTINCT', 'THE FLOW', 'ADAPTATION', 'VISION', 'PREDATOR MODE', 'AWAKENING', 'NO LIMIT', 'THE EGO', 'ISAGI FILE', 'EVOLUTION', 'INNER MONOLOGUE', 'BLUE LOCK ARCHIVE', 'NEXT LEVEL'];
  const path = name => '/manga/' + name.split('/').map(encodeURIComponent).join('/');
  const tiles = [...document.querySelectorAll('.dash-tile')];
  tiles.forEach((tile, i) => {
    tile.style.backgroundImage = `linear-gradient(180deg,rgba(4,6,10,.18),rgba(4,6,10,.82)),url("${path(files[(i + 1) % files.length])}")`;
    tile.style.backgroundSize = 'cover';
    tile.style.backgroundPosition = ['center','42% center','55% center','70% center','25% center','85% center'][i] || 'center';
  });
  const rail = document.querySelector('.rail-image img');
  if (rail) rail.src = path(files[1]);
  const gallery = document.querySelector('#gallery .gallery-grid');
  if (!gallery || document.querySelector('.manga-archive')) return;
  [...gallery.querySelectorAll('.gallery-tile')].forEach((tile, i) => {
    tile.style.backgroundImage = `linear-gradient(180deg,rgba(4,6,10,.12),rgba(4,6,10,.76)),url("${path(files[(i + 6) % files.length])}")`;
    tile.style.backgroundSize = 'cover'; tile.style.backgroundPosition = 'center';
  });
  const section = document.createElement('section');
  section.className = 'manga-archive reveal'; section.setAttribute('aria-label','Галерея манги Blue Lock');
  section.innerHTML = '<div class="manga-archive-head"><div><div class="kicker">/// 07 — BLUE LOCK / VISUAL FILES</div><h3>Манга. Без лишних слов.</h3></div><p>Локальный архив кадров: чёрно-белые страницы, контраст и холодный синий акцент. Нажми на кадр, чтобы открыть его крупно.</p></div><div class="manga-grid"></div>';
  const grid = section.querySelector('.manga-grid');
  files.forEach((file, i) => {
    const a = document.createElement('a'); a.className = 'manga-frame'; a.href = path(file); a.setAttribute('aria-label', `Открыть кадр манги ${i+1}`);
    const img = document.createElement('img'); img.src = path(file); img.alt = `Кадр манги Blue Lock — архив ${String(i+1).padStart(2,'0')}`; img.loading = i < 4 ? 'eager' : 'lazy';
    img.onerror = () => { a.remove(); }; a.append(img);
    const label = document.createElement('div'); label.className = 'manga-frame-label';
    const left = document.createElement('span'); left.textContent = titles[i]; const right = document.createElement('span'); right.textContent = `EA / ${String(i+1).padStart(3,'0')}`;
    label.append(left,right); a.append(label); grid.append(a);
  });
  gallery.insertAdjacentElement('afterend', section);
  const lightbox = document.createElement('div'); lightbox.className = 'manga-lightbox'; lightbox.setAttribute('role','dialog'); lightbox.setAttribute('aria-modal','true'); lightbox.setAttribute('aria-label','Просмотр кадра манги');
  lightbox.innerHTML = '<button type="button" aria-label="Закрыть просмотр">×</button><img alt="Увеличенный кадр манги">'; document.body.append(lightbox);
  const large = lightbox.querySelector('img'); const closeBtn = lightbox.querySelector('button');
  const close = () => { lightbox.classList.remove('open'); large.src = ''; document.body.style.overflow = ''; };
  grid.addEventListener('click', e => { const a = e.target.closest('a.manga-frame'); if (!a) return; e.preventDefault(); const im = a.querySelector('img'); large.src = im.src; large.alt = im.alt; lightbox.classList.add('open'); document.body.style.overflow = 'hidden'; closeBtn.focus(); });
  closeBtn.addEventListener('click', close); lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('open')) close(); });
  // Small interaction polish: current section marker follows the viewport.
  const navLinks = [...document.querySelectorAll('.top nav a')];
  const targets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && targets.length) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id)); }), {rootMargin:'-25% 0px -60% 0px'});
    targets.forEach(target => observer.observe(target));
  }
})();
