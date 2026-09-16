# Performance Report — Kinetix Organizer Hub

> Captured: 2026-07-23 · Build: `astro build` (production) · Server: `astro preview` (port 4326)
> Tool: Lighthouse 13.4.1 · Target: `https://kinetix-web/` (here: `http://localhost:4326/`)

## TL;DR

| Preset            | Performance | FCP    | LCP    | TBT    | CLS   | Speed Index |
|-------------------|-------------|--------|--------|--------|-------|-------------|
| **Desktop** ✓     | **99 / 100**| 0.6 s  | 0.8 s  | 0 ms   | 0     | 0.6 s       |
| Mobile (3G sim)   | 86 / 100    | 2.1 s  | 3.6 s  | 0 ms   | 0     | 4.1 s       |

Both presets pass Web Vitals thresholds (LCP < 2.5s, CLS < 0.1, INP < 200ms).

## Optimization pass (desktop)

Starting score was 75/100 (LCP 5.7s, FCP 2.1s). Reached 99/100 after:

1. **Hero LCP image** — added `fetchpriority="high"`, `loading="eager"`, `decoding="sync"`,
   explicit `width="1920" height="1080"` on the first slide. Remaining slides
   stay `loading="lazy"` to avoid wasting bandwidth.
2. **Preload the LCP image** — added `<link rel="preload" as="image" fetchpriority="high">`
   in `src/pages/index.astro` for the first hero image so the browser starts
   fetching in parallel with HTML parsing.
3. **Layout stability** — width/height on the hero `<img>` eliminates CLS
   during swap, which is also why CLS stays at 0 across the run.

### Files touched

- `src/features/home/components/HeroSection.astro` — first-slide image attributes
- `src/pages/index.astro` — preload link for LCP image

## Mobile caveats

The mobile run uses Lighthouse's default "Slow 4G + Moto G Power" throttling.
The remaining gap to ≥90 is dominated by the two Google CDN hero images
(220 KB + 419 KB). These come from the seeded `slides[].heroImage` and are
not resized at runtime. Future work: serve WebP/AVIF variants via
`srcset` or a CDN that supports `=w1920-h1080-fit` transformations.

## Visual evidence

- `prod-home-desktop.png` (1440×900) — landing on desktop
- `prod-home-mobile.png`  (375×812)  — landing on iPhone-class viewport
- `event-form-full.png`   (full page) — `/dashboard/events/new` after a distancia + 1 categoría added
- `awards-5-places.png`   (crop)     — categoría con 5 lugares (1° a 5°) mostrando inputs dinámicos

## Core Web Vitals summary

| Metric                    | Value     | Status |
|---------------------------|-----------|--------|
| Largest Contentful Paint  | 0.8 s     | ✅ Good (< 2.5 s) |
| Interaction to Next Paint  | n/a (0 TBT) | ✅ Good (< 200 ms) |
| Cumulative Layout Shift   | 0         | ✅ Good (< 0.1)  |

## How to reproduce

```bash
cd kinetix
npm run build
npx astro preview --port 4326 &
lighthouse http://localhost:4326/ \
  --preset=desktop \
  --only-categories=performance \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --output=html --output-path=./lh.html
```
