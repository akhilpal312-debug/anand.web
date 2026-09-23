import { SITE_CONFIG } from './config.js';
import { setMouse } from './scene.js';

export function initInteractions() {
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // footer + contact year/links from config (no fake phone)
  bindContactLinks();

  // hamburger
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  btn?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }));

  // smooth anchor (native smooth + offset handled by CSS scroll-margin)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const el = document.querySelector(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  });

  // image fallback: hide broken imgs, show gradient fallback underneath
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
    if (img.complete && img.naturalWidth === 0) img.style.display = 'none';
  });

  if (isTouch) return; // below is desktop-only

  // custom cursor + magnetic buttons
  document.body.classList.add('has-cursor');
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  let x = -100, y = -100, rx = -100, ry = -100;
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
  }, { passive: true });
  (function loop() {
    rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
    if (ring) ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a,button,.card3d,.g-photo,.c-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
  document.addEventListener('mousedown', () => {
    if (dot) dot.style.scale = '0.8';
  });
  document.addEventListener('mouseup', () => {
    if (dot) dot.style.scale = '1';
  });

  // 3D tilt on interest cards
  document.querySelectorAll('.card3d').forEach(card => {
    let raf = 0;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(900px) rotateY(${px * 14}deg) rotateX(${-py * 12}deg) translateZ(8px)`;
        const sh = card.querySelector('.shine');
        if (sh) sh.style.transform = `skewX(-18deg) translateX(${260 * px + 130}%)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });

  // subtle touch/drag parallax for desktop mouse -> also feeds WebGL
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setMouse(nx, ny);
    document.querySelectorAll('.float-photo').forEach((f, i) => {
      const d = (i + 1) * 6;
      f.style.translate = `${-nx * d}px ${-ny * d}px`;
    });
  }, { passive: true });
}

function bindContactLinks() {
  // Instagram / Telegram set from config; phone gracefully disabled when empty
  document.querySelectorAll('[data-ig]').forEach(a => {
    a.href = SITE_CONFIG.instagramUrl;
    a.setAttribute('aria-label', `Instagram ${SITE_CONFIG.instagram}`);
  });
  document.querySelectorAll('[data-tg]').forEach(a => {
    a.href = SITE_CONFIG.telegramUrl;
    a.setAttribute('aria-label', `Telegram ${SITE_CONFIG.telegram}`);
  });
  document.querySelectorAll('[data-ig-handle]').forEach(el => el.textContent = SITE_CONFIG.instagram);
  document.querySelectorAll('[data-tg-handle]').forEach(el => el.textContent = SITE_CONFIG.telegram);

  const phoneCards = document.querySelectorAll('[data-phone-card]');
  phoneCards.forEach(card => {
    const num = (SITE_CONFIG.phone || '').trim();
    const label = card.querySelector('[data-phone-label]');
    if (!num) {
      card.classList.add('disabled');
      // never leave a dead button: point to contact section with explanatory tooltip
      if (card.tagName === 'A') card.href = '#contact';
      if (label) label.textContent = 'Number coming soon';
      card.setAttribute('aria-disabled', 'true');
      card.title = 'Phone number will be added soon';
    } else {
      card.href = `tel:${num.replace(/\s+/g, '')}`;
      if (label) label.textContent = num;
    }
  });
}
