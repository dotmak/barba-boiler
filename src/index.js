import barba from '@barba/core';
import gsap from 'gsap';
import { initTextReveal } from './modules/initTextReveal.js';
import { initHome } from './home.js';
import { initTestpage } from './testpage.js';

const pages = {
  home: initHome,
  testpage: initTestpage,
};

let globalTeardown = null;
let pageTeardown = null;

barba.init({
  cache: false,
  transitions: [
    {
      name: 'fade',
      leave({ current }) {
        const done = this.async();
        gsap.timeline({ onComplete: done })
          .to(current.container, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' });
      },
      enter({ next }) {
        gsap.set(next.container, { autoAlpha: 0 });
        return gsap.to(next.container, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
      },
    },
  ],
});

barba.hooks.afterEnter(({ next }) => {
  globalTeardown = initTextReveal(next.container);
  pageTeardown = pages[next.namespace]?.(next.container) ?? null;
});

barba.hooks.beforeLeave(() => {
  pageTeardown?.();
  globalTeardown?.();
  pageTeardown = null;
  globalTeardown = null;
});
