export function initTestpage(container) {
  const teardowns = [];

  return () => teardowns.forEach((fn) => fn());
}
