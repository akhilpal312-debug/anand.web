import { initScene } from './scene.js';
import { initAnimations } from './animations.js';
import { initInteractions } from './interactions.js';

const loader = document.getElementById('loader');

// set initial hidden states for intro (so GSAP .to() reveals)
function prime() {
  const css = document.createElement('style');
  css.textContent = `.hero-copy .welcome,.hero-tag,.hero-cta{opacity:0;transform:translateY(24px)}
    .hero-title span{opacity:0;transform:translateY(60px) rotate(2deg);display:inline-block}
    .portrait-stage{opacity:0;transform:translateY(40px) scale(.94)}
    .float-photo{opacity:0;transform:scale(.85)}
    .hero-vibes{opacity:0;transform:translateX(20px)}`;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.head.appendChild(css);
}

prime();

try {
  const canvas = document.getElementById('webgl');
  initScene(canvas);
} catch (err) {
  console.warn('[scene] WebGL unavailable, continuing without 3D:', err);
  document.getElementById('webgl')?.remove();
}

window.addEventListener('DOMContentLoaded', () => {
  initInteractions();
  initAnimations();
  // cinematic loader — short, then reveal
  setTimeout(() => loader?.classList.add('done'), 900);
  setTimeout(() => loader?.remove(), 1800);
});

// safety: if images folder empty, no console errors — handled via onerror + fallbacks
