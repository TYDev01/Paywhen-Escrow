# Image assets

Drop the project owner's original photographs and visual assets here. Files in
`public/` are served statically, so you can **add images without rebuilding** the app
(with `next start`, newly added files are served immediately).

## How to use

1. Add your image, e.g. `public/assets/hero.jpg`.
2. Reference it with the `Media` component, which reserves space (no layout shift),
   lazy-loads, crops with `object-fit`, and requires alt text:

```tsx
import { Media } from "@/components/ui/media";

<Media src="/assets/hero.jpg" alt="Two people completing a secure handover" ratio="4 / 3" />
```

3. Optionally keep `manifest.json` updated so galleries can be data-driven.

## Hero carousel

The homepage hero shows an animated carousel. To supply its images, add files to
this folder and list them under `hero` in `manifest.json` — no rebuild needed:

```json
{
  "hero": [
    { "src": "/assets/hero-1.jpg", "alt": "A buyer and seller completing a handover", "title": "Held in escrow", "subtitle": "Payment stays safe until the deal is done" },
    { "src": "/assets/hero-2.jpg", "alt": "Package being inspected on delivery" }
  ],
  "images": []
}
```

Each slide needs a real `alt`. `title`/`subtitle` are optional overlay captions.
While `hero` is empty, the carousel shows designed placeholder slides.

## Rules
- Always provide meaningful `alt` text (or `alt=""` for purely decorative images).
- Prefer optimised formats (AVIF/WebP) and appropriately sized files.
- Do not add fabricated testimonial headshots or misleading imagery. Until real assets
  are supplied, the designed placeholder renders instead.
