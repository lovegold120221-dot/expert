---
name: mobile-pwa-design
description: "Design and build modern Progressive Web App frontends and mobile-first HTML/CSS/JS interfaces. Use when user asks to: design a mobile app frontend, create a PWA, build a mobile-friendly web app, design a smartphone-optimized UI, create an app-like web experience, build a touch-optimized interface, develop a mobile-first responsive site, create an installable web app, design app UI screens, build a mobile ecommerce/store frontend, create a food delivery app UI, design a fintech/banking app interface, build a fitness/wellness app, create a social media mobile UI, design a dashboard for mobile, build a HTML/CSS/JS mobile template. Also applies to: designing frontend for mobile apps, modern PWA app creation, mobile-first responsive design, touch-optimized UI patterns, app-like web experiences, converting web apps to PWA, mobile UI/UX design, building app shells, implementing bottom tab navigation, mobile card-based layouts, dark mode mobile interfaces. Reference: ThemeForest Mobile category (https://themeforest.net/category/site-templates/mobile) — 400+ mobile templates for design inspiration."
---

# Mobile PWA Design — ThemeForest-Inspired

Build production-quality mobile-first PWAs with app-like UX, offline support, and modern CSS/JS. This skill incorporates design patterns from the top-selling ThemeForest mobile templates (AppKit, Sticky Mobile, Mobilize, Cartly, PayQra, Finapp, and 400+ more).

## Design Philosophy

Mobile PWAs sit at the intersection of **website** and **native app**. The best ThemeForest templates nail three things:

1. **App-like feel** — gesture-driven, smooth transitions, bottom navigation, springy physics
2. **Touch-first** — 48px+ tap targets, swipe actions, pull-to-refresh, overscroll
3. **Offline-resilient** — skeleton screens, cached shells, graceful degradation

## Reference: Top ThemeForest Mobile Templates

| Template | Style | Best For | Key Features |
|----------|-------|----------|-------------|
| **AppKit** (by Enabled) | Clean, iOS-inspired | Multi-purpose apps | 2.3K sales, 4.99★ — the gold standard |
| **Sticky Mobile** (by Enabled) | Sticky header/footer | Content apps | 5.5K sales, 4.98★ — bottom nav pattern |
| **Mobilize** (by BeantownThemes) | Lightweight, flat | Touch-optimized sites | 3.5K sales — OG mobile template |
| **Appeca** (by Enabled) | Polished, card-based | Social/app UIs | 654 sales, 5.0★ — PWA ready |
| **Finapp** (by Bragher) | Dark/light, financial | Fintech/banking | 2K sales, 5.0★ — wallet UI |
| **Cartly** (by createuiux) | Tailwind CSS + PWA | eCommerce/Live Shopping | Latest gen, Tailwind |
| **PayQra** (by themesflat) | E-Wallet theme | Fintech/PWA | 21 sales, modern PWA |
| **MarketPro** (by wowtheme7) | Tailwind + Figma | eCommerce/PWA | 5 sales, has Figma |
| **DineHub** (by George_Fx) | Nuxt JS | Food delivery | New release |
| **Yummer** (by George_Fx) | Vue 3 | Food/Restaurant | Vue 3 + PWA |
| **Kolor Mobile** (by Enabled) | Colorful, vibrant | Creative/brand apps | 594 sales, 5.0★ |
| **Go Mobile** (by BeantownThemes) | Lightweight, fast | General mobile | 3.5K sales, versatile |

## Tech Stack Patterns

From the ThemeForest ecosystem, the dominant stacks are:

```
Bootstrap 5 HTML (classic) ──── Mobilize, Go Mobile, Sticky
         │
         ├── Tailwind CSS ────── Cartly, MarketPro, EasyPay
         │
         ├── Vue 3 ───────────── Yummer, StepHub
         │
         └── Nuxt JS ─────────── DineHub, Suha (PWA-ready)
```

**Recommended default stack**: Tailwind CSS + vanilla JS + service worker (zero framework lock-in, PWA-capable, fast)

## Core PWA Implementation

### 1. Manifest (`manifest.json`)

```json
{
  "name": "App Name",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Link in `<head>`: `<link rel="manifest" href="/manifest.json">`

### 2. Service Worker (offline + cache)

```javascript
// sw.js — App Shell pattern (used by all top ThemeForest PWAs)
const CACHE = 'app-v1';
const SHELL = ['/', '/index.html', '/offline.html', '/css/app.css', '/js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request)
      .then(res => { const r = res.clone(); caches.open(CACHE).then(c => c.put(e.request, r)); return res; })
      .catch(() => caches.match('/offline.html'))
    )
  );
});
```

Register: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`

### 3. iOS Meta Tags (for "Add to Home Screen")

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="App">
<link rel="apple-touch-icon" href="/icons/192.png">
```

## Mobile-First HTML Shell (ThemeForest-Inspired)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#6366f1">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icons/192.png">
  <title>Mobile App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* App-like feel: fixed bottom nav, safe areas, springy scroll */
    body { overscroll-behavior-y: contain; -webkit-font-smoothing: antialiased; }
    .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
    .safe-top { padding-top: env(safe-area-inset-top, 0px); }
    .app-shell { max-width: 430px; margin: 0 auto; min-height: 100dvh; }
    .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
                  width: 100%; max-width: 430px; z-index: 50; }
    /* Skeleton screen for perceived performance */
    .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  </style>
</head>
<body class="bg-gray-50">
  <div class="app-shell safe-top safe-bottom" id="app">
    <!-- Status Bar spacer -->
    <header class="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-40 safe-top">
      <h1 class="text-lg font-semibold">App</h1>
      <button aria-label="Menu">☰</button>
    </header>
    <!-- Main Content Area -->
    <main class="px-4 pb-20" id="content"><!-- pages render here --></main>
    <!-- Bottom Tab Navigation (the AppKit/Sticky pattern) -->
    <nav class="bottom-nav bg-white border-t border-gray-200 flex justify-around items-center h-16 safe-bottom">
      <button class="flex flex-col items-center text-indigo-500" data-tab="home">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        <span class="text-xs mt-0.5">Home</span>
      </button>
      <button class="flex flex-col items-center text-gray-400" data-tab="search">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <span class="text-xs mt-0.5">Search</span>
      </button>
      <button class="flex flex-col items-center text-gray-400" data-tab="cart">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.22 4.22L7.76 9h9.48l2.76-5.22L5.22 4.22z"/></svg>
        <span class="text-xs mt-0.5">Cart</span>
      </button>
      <button class="flex flex-col items-center text-gray-400" data-tab="profile">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <span class="text-xs mt-0.5">Profile</span>
      </button>
    </nav>
  </div>
  <script>
    // Tab routing (simple SPA pattern)
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-tab]').forEach(b => b.classList.replace('text-indigo-500','text-gray-400'));
        btn.classList.replace('text-gray-400','text-indigo-500');
        switchTab(btn.dataset.tab);
      });
    });
    function switchTab(tab) { /* render content for tab */ }
  </script>
</body>
</html>
```

## UI Patterns from ThemeForest Top Sellers

### Bottom Tab Navigation (AppKit/Sticky pattern)
5-tab fixed bottom bar, 48px+ touch targets, active state with color + icon fill. The most common navigation pattern across all top sellers.

### Card-Based Content (Appeca/Finapp pattern)
Rounded cards with shadow, 16px padding, white bg on gray-50 canvas. Each card is a self-contained touch target.

### Pull-to-Refresh (Mobilize pattern)
```javascript
let startY = 0;
document.addEventListener('touchstart', e => startY = e.touches[0].pageY);
document.addEventListener('touchmove', e => {
  const dy = e.touches[0].pageY - startY;
  if (dy > 100 && window.scrollY === 0) { refresh(); startY = e.touches[0].pageY; }
});
```

### Skeleton Screens (AppKit pattern)
Show shimmering gray placeholders while data loads, then cross-fade to real content. Critical for PWA perceived performance.

### Dark Mode Toggle (Finapp pattern)
```html
<button onclick="document.documentElement.classList.toggle('dark')">🌙</button>
```
With Tailwind: `dark:` variants for all colors.

### Swipeable Cards (Cartly/MarketPro pattern)
```javascript
let startX, currentX;
element.addEventListener('touchstart', e => startX = e.touches[0].clientX);
element.addEventListener('touchmove', e => {
  currentX = e.touches[0].clientX;
  const diff = currentX - startX;
  element.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
});
element.addEventListener('touchend', () => {
  if (currentX - startX > 100) swipeAway('right');
  else element.style.transform = '';
});
```

## Responsive Breakpoints for Mobile-First

Use min-width (mobile-first) pattern:

```css
/* Mobile-first: default styles target phones */
.container { padding: 16px; }

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .container { padding: 24px; max-width: 720px; margin: 0 auto; }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container { max-width: 960px; }
}
```

For PWA apps, cap at 430px (iPhone 16 Pro Max width) for app-like feel on tablets:
```css
.app-shell { max-width: 430px; margin: 0 auto; }
```

## Testing PWA Readiness

```bash
# Check manifest
curl -s https://your-site.com/manifest.json | python3 -m json.tool

# Audit with Lighthouse (via Playwright)
npx -y playwright@latest open --save-content ~/Desktop/lighthouse.txt https://your-site.com

# Check service worker is registered
# In browser console: navigator.serviceWorker.controller
```

## Checklist: Shipping a Production PWA

- [ ] Manifest.json with all icons (192, 512, maskable)
- [ ] Service worker with app shell caching
- [ ] Offline fallback page
- [ ] iOS meta tags + apple-touch-icon
- [ ] 48px minimum touch targets
- [ ] Viewport-fit=cover for notched phones
- [ ] Safe area insets (env(safe-area-inset-*))
- [ ] Status bar color (theme-color meta)
- [ ] Smooth page transitions (view transitions API or CSS)
- [ ] Skeleton screens for async content
- [ ] Dark mode support
- [ ] Tested on real devices (Chrome DevTools device mode)
- [ ] Lighthouse PWA badge passing (score ≥ 90)
- [ ] HTTPS (required for service workers)

## Design Inspiration Sources

Browse 400+ live previews on ThemeForest for visual reference:
```
https://themeforest.net/category/site-templates/mobile?sort=sales     # Best sellers
https://themeforest.net/category/site-templates/mobile?sort=rating    # Top rated
https://themeforest.net/category/site-templates/mobile?sort=date      # Newest
```

## Experience Notes

Path: `{working-directory}/mobile-pwa-design-memories/mobile-pwa-design.memory.md`

**Before execution**: If the file exists, read it first.

**After execution**: If unexpected situation encountered or better pattern discovered, append:
`{YYYY-MM-DD}: {what happened} → {conclusion}`
