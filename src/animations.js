import { setScrollProgress, addVelocity } from './scene.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

gsap.registerPlugin(ScrollTrigger);
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initAnimations() {
  // graceful fallback if CDN blocked: show everything, still bind scroll->camera minimally
  if (!window.gsap || !window.ScrollTrigger) {
    document.querySelectorAll('.hero-copy .welcome,.hero-tag,.hero-cta,.hero-title span,.portrait-stage,.float-photo,.hero-vibes')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      setScrollProgress(window.scrollY / max);
    }, { passive: true });
    return;
  }
  const rm = reduceMotion();

  // overall scroll progress -> 3D camera
  ScrollTrigger.create({
    trigger: document.body,
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      setScrollProgress(self.progress);
      const v = Math.abs(self.getVelocity() || 0) / 4000;
      if (v > 0.15 && !rm) addVelocity(Math.min(v, 1.2) * 0.25);
    }
  });

  // loader out + hero intro (separate timeline)
  const heroIntro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroIntro
    .to('.hero-copy .welcome', { opacity: 1, y: 0, duration: 0.7 }, 0.15)
    .to('.hero-title span', { opacity: 1, y: 0, rotate: 0, duration: 0.9, stagger: 0.12 }, 0.25)
    .to('.hero-tag', { opacity: 1, y: 0, duration: 0.7 }, 0.6)
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.7 }, 0.72)
    .to('.portrait-stage', { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'expo.out' }, 0.3)
    .to('.float-photo', { opacity: 1, scale: 1, duration: 0.8, stagger: 0.12 }, 0.7)
    .to('.hero-vibes', { opacity: 1, x: 0, duration: 0.7 }, 0.9);

  // hero scroll-out: portrait back + sideways + scale down, title up
  if (!rm) {
    gsap.timeline({
      scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 1 }
    })
      .to('.portrait-stage', { y: -90, x: 60, scale: 0.82, rotateY: 10, opacity: 0.55, ease: 'none' }, 0)
      .to('.hero-copy', { y: -120, opacity: 0.15, ease: 'none' }, 0)
      .to('.float-photo.fp1', { y: -140, x: -40, rotation: -18, ease: 'none' }, 0)
      .to('.float-photo.fp2', { y: -100, x: 50, rotation: 16, ease: 'none' }, 0)
      .to('.float-photo.fp3', { y: -70, rotation: -12, ease: 'none' }, 0);
  }

  // ABOUT timeline
  gsap.timeline({
    scrollTrigger: { trigger: '#about', start: 'top 80%', end: 'top 20%', scrub: 1 }
  })
    .fromTo('.about-photo', { opacity: 0, scale: 0.82, y: 60, rotation: -6 }, { opacity: 1, scale: 1, y: 0, rotation: 0, ease: 'none' }, 0)
    .fromTo('.about-text .line', { opacity: 0, y: 34 }, { opacity: 1, y: 0, stagger: 0.12, ease: 'none' }, 0.1)
    .fromTo('.info-card', { opacity: 0, x: 80 }, { opacity: 1, x: 0, ease: 'none' }, 0.2);

  // INTERESTS — varied entrances
  const cards = gsap.utils.toArray('.card3d');
  cards.forEach((c, i) => {
    const from = [
      { y: 90, rotationX: 18 }, { y: 70, x: -40, rotation: -6 }, { y: 110, scale: 0.85 },
      { y: 80, x: 40, rotation: 6 }, { y: 100, rotationY: 20 }, { y: 70, scale: 0.9, rotation: 4 }
    ][i % 6];
    gsap.fromTo(c, { opacity: 0, ...from }, {
      opacity: 1, y: 0, x: 0, scale: 1, rotation: 0, rotationX: 0, rotationY: 0, ease: 'none',
      scrollTrigger: { trigger: '#interests', start: `top ${78 - i * 2}%`, end: `top ${38 - i * 1.5}%`, scrub: 1 }
    });
  });
  // gentle idle float (non-scrub, desktop)
  if (!rm && window.innerWidth > 760) {
    cards.forEach((c, i) => {
      gsap.to(c, { y: `-=${6 + (i % 3) * 3}`, duration: 2 + (i % 4) * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.15 });
    });
  }

  // GALLERY parallax — foreground faster, background slower
  gsap.utils.toArray('.g-photo').forEach((el) => {
    const speed = parseFloat(el.dataset.speed || '1');
    gsap.fromTo(el,
      { y: 60 * speed, x: -30 * speed, rotation: -4 * speed, opacity: 0.35 },
      {
        y: -60 * speed, x: 30 * speed, rotation: 4 * speed, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: 1.2 }
      });
  });

  // CONTACT — left / center / right entrances
  gsap.timeline({
    scrollTrigger: { trigger: '#contact', start: 'top 85%', end: 'top 35%', scrub: 1 }
  })
    .fromTo('.c-card.c-ig', { opacity: 0, x: -90, rotation: -4 }, { opacity: 1, x: 0, rotation: 0, ease: 'none' }, 0)
    .fromTo('.c-card.c-tg', { opacity: 0, y: 70, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, ease: 'none' }, 0.1)
    .fromTo('.c-card.c-ph', { opacity: 0, x: 90, rotation: 4 }, { opacity: 1, x: 0, rotation: 0, ease: 'none' }, 0.2)
    .fromTo('.contact-copy .line', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.1, ease: 'none' }, 0);

  // footer settle
  gsap.fromTo('footer', { opacity: 0.4 }, {
    opacity: 1, ease: 'none',
    scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'top 70%', scrub: 1 }
  });

  // nav shrink + active section
  ScrollTrigger.create({
    start: 40, end: 'max',
    onEnter: () => document.querySelector('header.nav')?.classList.add('scrolled'),
    onLeaveBack: () => document.querySelector('header.nav')?.classList.remove('scrolled')
  });

  ['home', 'about', 'interests', 'gallery', 'contact'].forEach((id) => {
    ScrollTrigger.create({
      trigger: `#${id}`, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) {
          document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.sec === id));
          document.querySelectorAll('#mobileMenu a.big').forEach(a => a.classList.toggle('active', a.dataset.sec === id));
        }
      }
    });
  });

  // parallax on section backgrounds
  if (!rm) {
    gsap.utils.toArray('section .wrap').forEach((w) => {
      gsap.fromTo(w, { y: 26 }, {
        y: -26, ease: 'none',
        scrollTrigger: { trigger: w.closest('section'), start: 'top bottom', end: 'bottom top', scrub: 1.4 }
      });
    });
  }
}
