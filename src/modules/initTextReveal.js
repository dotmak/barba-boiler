export function initTextReveal(scope = document) {
  const elements = scope.querySelectorAll('.text-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 1 },
  );

  elements.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}
