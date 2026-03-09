# Parallax Demo

A playground / test demo built for a client to explore parallax scrolling concepts and visual effects. This is **not** a production project — just a sandbox for experimenting with ideas and showcasing what's possible.

## Features

- **Multi-layer parallax** — Multiple depth layers (buildings, fog, water, foreground) that respond to mouse/pointer movement for a 3D feel
- **GSAP reveal animation** — Cinematic staggered intro that fades and slides each layer into view on page load
- **Animated birds** — Canvas-based flocking bird simulation rendered on an overlay canvas
- **Falling leaves** — Leaf particles that drift across the scene for added atmosphere
- **Responsive scaling** — Layout adapts across desktop, laptop, tablet, and mobile screen sizes
- **Performance optimizations** — `requestAnimationFrame`-based rendering, `will-change` hints, visibility-change pausing, and pointer event coalescing
- **Reduced motion support** — Respects `prefers-reduced-motion` for accessibility

## Tech Stack

- HTML / CSS / Vanilla JS
- [GSAP 3](https://greensock.com/gsap/) for timeline animations

## Credits

- **Birds animation** by [Tiffany Rayside](https://codepen.io/tmrDevelops/pen/dMdNvy)
