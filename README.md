# Anand Pal — Personal World

Just Anand. Nothing Ordinary. Immersive scroll-driven 3D personal website.

No Journey section. No developer/coder claims. Phone left empty by design.

## Run

```bash
npm install
npm run dev
# open http://localhost:5173
```

Static site — no build step. Deploy `./` as-is to Vercel / Netlify / GitHub Pages.

## Add Anand's real photos (optional, preserves identity)

Drop files here (exact names). Site shows graceful gradient fallback if missing:

- `assets/images/anand-hero.jpg` — main hero portrait
- `assets/images/anand-about.jpg` — about polaroid
- `assets/images/gallery-1.jpg` … `gallery-4.jpg`

> Do not distort faces. Use real photos only.

## Edit content / phone

`src/config.js` → `SITE_CONFIG`:

```js
phone: "+91XXXXXXXXXX" // leave "" to show "Number coming soon"
```

## Structure

- `index.html` — sections: Home → About → Interests → Gallery → Contact → Footer
- `src/style.css` — cinematic theme + responsive (320px → 1920px)
- `src/scene.js` — persistent Three.js world (fog, sun, ridge, floaters, particles, scroll camera, mouse lerp)
- `src/animations.js` — separate GSAP ScrollTrigger timelines per section, scrub-based
- `src/interactions.js` — cursor, tilt, hamburger, touch support, link binding
- `src/config.js` — site + asset config
