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

Keep a single primary action. The default structure is:

- brand/product eyebrow;
- large learning-experience title;
- concise one- or two-line description;
- optional metadata chips for level, subject, or mode;
- one Start button.

Avoid decorative clutter, carousels, mode cards, or subject-specific color themes unless requested. The landing page should feel credible for international professional educational software.

## App Page

The app page contains a compact header and `.app-main-card`. The protected content shell is:

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
