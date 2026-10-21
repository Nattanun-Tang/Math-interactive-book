# Starter Contract

## Purpose

The starter provides a polished subject-neutral frame for educational web apps. Preserve the framework shell and replace only content and topic-specific behavior.

## Files

- `index.html`: landing page + app page + protected content shell.
- `base.css`: global reset, canvas, landing/app shell, shared controls, responsive behavior.
- `content.js`: default Thai copy in `window.CONTENT`.
- `styles.css`: app-specific CSS; intentionally minimal in the starter.
- `script.js`: view switching and app-specific initialization.

## Landing Page

Keep a single primary action. Series structure:

- brand/product eyebrow — **72px**, color `#e71312`;
- learning-experience title — **72px**, color `#e71312`;
- one Start button — **36px** text, accent fill;
- one right-side image — authoring size ~**660×720**, CSS max-height up to **900px**.

Landing background is flat **`#ffffff`**. Avoid decorative clutter, carousels, mode cards, or alternate brand palettes. Full token tables live in `SKILL.md` → Series Visual System.

## App Page

The app page contains a red series header and `.app-main-card` (1920×1080). Header: background `rgba(220, 53, 69, 0.96)`, title **56px** white. Content margins: **16px 72px 24px**.

Protected content shell:

```html
<main id="contentGrid" class="app-content">
  <div id="appLayout" class="app-layout"></div>
</main>
```

Do not attach topic classes to `#contentGrid`.

## Width Budget

- Canvas: 1920×1080.
- `.app-content`: 72 px left + 72 px right margins; 1776 px usable width.
- Keep `width: auto` on `.app-content`.
- `#appLayout` may use `width: 100%` and must stay within the protected shell.

## Responsive Contract

The starter uses a desktop design canvas with responsive reflow. Do not solve responsiveness by shrinking text to illegibility. Collapse columns, wrap controls, and allow vertical scrolling when needed.
