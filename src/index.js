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
      name: 'opacity-transition',
      leave(data) {
        return gsap.to(data.current.container, { opacity: 0 });
      },
      enter(data) {
        return gsap.from(data.next.container, { opacity: 0 });
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
