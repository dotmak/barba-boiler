export function initHome(container) {
  const teardowns = [];

  // Add page-specific module inits here, e.g.:
  // teardowns.push(initHeroAnim(container));

  return () => teardowns.forEach((fn) => fn());
}
