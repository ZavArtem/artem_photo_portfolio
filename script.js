/**
 * =====================================================
 * ЗАВОДЧИКОВ АРТЁМ — Portfolio JS
 * Функционал:
 *   1. Навигация: scroll-class, бургер-меню
 *   2. Reveal-анимации через IntersectionObserver
 *   3. Lightbox (портфолио)
 *   4. Lazy loading изображений
 *   5. Видео-заглушка
 *   6. Плавный скролл для якорей
 * =====================================================
 */

'use strict';

/* ─── 1. НАВИГАЦИЯ ──────────────────────────────────── */
(function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const links  = document.getElementById('navLinks');

  // Добавляем класс .scrolled при прокрутке
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // вызвать сразу при загрузке

  // Бургер: открыть / закрыть меню
  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
    // Блокируем прокрутку body при открытом меню
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Закрываем меню при клике на ссылку
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Закрываем меню нажатием Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();


/* ─── 2. REVEAL ANIMATIONS ──────────────────────────── */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Если браузер не поддерживает IntersectionObserver — показываем всё сразу
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // один раз, затем отписываемся
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ─── 3. LIGHTBOX ────────────────────────────────────── */
(function initLightbox() {
  const items    = Array.from(document.querySelectorAll('.portfolio__item'));
  const lb       = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lbImg');
  const lbClose  = document.getElementById('lbClose');
  const lbPrev   = document.getElementById('lbPrev');
  const lbNext   = document.getElementById('lbNext');
  const lbBack   = document.getElementById('lbBackdrop');

  if (!lb || !items.length) return;

  let current = 0;

  // Получить массив URL-ов полного разрешения
  const fullUrls = items.map(item => item.dataset.full || item.querySelector('img').src);

  function open(index) {
    current = ((index % items.length) + items.length) % items.length;
    lbImg.src = fullUrls[current];
    lbImg.alt = items[current].querySelector('img').alt || 'Фото';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  // Открыть по клику на элемент портфолио
  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
    // Клавиатурная доступность
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'Открыть фото');
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  lbClose.addEventListener('click', close);
  lbBack.addEventListener('click', close);
  lbPrev.addEventListener('click', () => open(current - 1));
  lbNext.addEventListener('click', () => open(current + 1));

  // Клавиатурная навигация в lightbox
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  open(current - 1);
    if (e.key === 'ArrowRight') open(current + 1);
  });

  // Свайп на тач-устройствах
  let touchStartX = 0;
  lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) open(dx < 0 ? current + 1 : current - 1);
  });
})();


/* ─── 4. LAZY LOADING ────────────────────────────────── */
(function initLazyLoad() {
  // Нативный lazy loading (loading="lazy") уже используется в HTML.
  // Этот блок — дополнительный fallback для браузеров без нативной поддержки.
  if ('loading' in HTMLImageElement.prototype) return; // нативный — достаточно

  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!images.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
})();


/* ─── 5. ВИДЕО-ЗАГЛУШКА ──────────────────────────────── */
(function initVideo() {
  const wrapper     = document.getElementById('videoWrapper');
  const placeholder = document.getElementById('videoPlaceholder');
  const playBtn     = document.getElementById('videoPlayBtn');

  if (!wrapper || !playBtn) return;

  // Клик по кнопке Play — вставляем iframe (ленивая загрузка видео)
  playBtn.addEventListener('click', loadVideo);
  if (placeholder) placeholder.addEventListener('click', loadVideo);

  function loadVideo() {
    const src = wrapper.dataset.src;
    if (!src || src.includes('YOUR_VIDEO_ID')) {
      // Заглушка ещё не заменена — показываем подсказку
      alert('Замените data-src в секции #video на реальную ссылку embed-видео.');
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = 'Видео о процессе съёмки';
    // Убираем заглушку, вставляем iframe
    if (placeholder) placeholder.remove();
    wrapper.appendChild(iframe);
  }
})();


/* ─── 6. ПЛАВНЫЙ СКРОЛЛ ─────────────────────────────── */
(function initSmoothScroll() {
  // CSS scroll-behavior: smooth уже включён, но обрабатываем отступ nav
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
