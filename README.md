# Barba + GSAP Orchestration

A simple pattern for cleaning up animations, observers, and listeners between page transitions.

## The Problem

Barba swaps the DOM without reloading. That means:

- `window.addEventListener('load')` never fires again after the first page.
- Observers, ScrollTriggers, and listeners from the old page **keep running** even after their elements are gone.
- Re-running init code on every page stacks duplicates → memory leaks and double-firing bugs.

You need to **set things up on enter** and **clean them up on leave**.

## The Pattern: init returns destroy

Every init function returns a function that undoes its work.

```js
// src/modules/initTextReveal.js
export function initTextReveal(scope = document) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 1 });

  scope.querySelectorAll('.text-reveal').forEach((el) => observer.observe(el));

  return () => observer.disconnect();   // <-- the teardown
}
```

Usage:

```js
const teardown = initTextReveal(container);
// ...later, when leaving the page...
teardown();
```

## What "teardown" means

Anything you register with the browser keeps running until you stop it:

| Created with...        | Stopped with...            |
| ---------------------- | -------------------------- |
| `IntersectionObserver` | `observer.disconnect()`    |
| `addEventListener`     | `removeEventListener(...)` |
| `setInterval`          | `clearInterval(id)`        |
| GSAP `ScrollTrigger`   | `trigger.kill()`           |
| GSAP looping tween     | `tween.kill()`             |

A teardown is just a function that calls those stop methods.

## How `return` makes this work

The returned function remembers the variables from the function that created it. This is called a **closure**.

```js
function initTextReveal() {
  const observer = new IntersectionObserver(/* ... */);
  return () => observer.disconnect();
}

const a = initTextReveal();   // remembers observer #1
const b = initTextReveal();   // remembers observer #2

a();   // disconnects observer #1
b();   // disconnects observer #2
```

Each call creates a fresh `observer` and a fresh function that remembers *that specific* `observer`. They can't get mixed up.

### Why a shared variable would break

```js
let observer;
function init()    { observer = new IntersectionObserver(...); }
function destroy() { observer.disconnect(); }

init();    // observer #1
init();    // observer #1 overwritten — leaked, can never be disconnected
destroy(); // only stops observer #2
```

Returning a function avoids the shared variable entirely.

## Page-level composition

Each page collects teardowns from its modules and returns one combined teardown.

```js
// src/home.js
export function initHome(container) {
  const teardowns = [
    initHeroAnim(container),
    initSlider(container),
  ];
  return () => teardowns.forEach((fn) => fn());
}
```

## Wiring it into Barba

```js
// src/index.js
import barba from '@barba/core';
import { initTextReveal } from './modules/initTextReveal.js';
import { initHome }     from './home.js';
import { initTestpage } from './testpage.js';

const pages = { home: initHome, testpage: initTestpage };

let globalTeardown = null;
let pageTeardown = null;

barba.init({ /* transitions... */ });

barba.hooks.afterEnter(({ next }) => {
  globalTeardown = initTextReveal(next.container);
  pageTeardown   = pages[next.namespace]?.(next.container) ?? null;
});

barba.hooks.beforeLeave(() => {
  pageTeardown?.();
  globalTeardown?.();
  pageTeardown = null;
  globalTeardown = null;
});
```

### Flow

```
enter home    → save home teardown
leave home    → run home teardown
enter testpage → save testpage teardown
leave testpage → run testpage teardown
```

## Do I need `home.js` and `about.js`?

- Behavior on **every** page → put it in a global Barba hook.
- Behavior **specific** to one page → put it in that page's file.

If your page files are identical copy-paste, you don't have per-page work yet. Add the files once a page actually needs something unique.

## Why pass `container` to inits

During a transition, both old and new containers exist in the DOM for a moment. `document.querySelectorAll(...)` would match elements from both. Pass `next.container` so queries only see the new page.

## GSAP safety net

ScrollTriggers leak easily. A blanket kill on leave is cheap insurance alongside your per-module teardowns:

```js
import ScrollTrigger from 'gsap/ScrollTrigger';

barba.hooks.beforeLeave(() => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
});
```

## TL;DR

1. Every `init` returns its `destroy`.
2. `destroy` remembers what `init` created, via closure.
3. Pages combine module teardowns into one.
4. Barba hooks run the right init on enter, the right teardown on leave.
5. Always scope queries to `next.container`.
