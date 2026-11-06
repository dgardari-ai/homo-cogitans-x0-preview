/* Independent, initially expanded home sections. Inner accordions keep their own state. */
(() => {
  'use strict';
  const home = document.getElementById('blog-home');
  if (!home) return;

  home.querySelectorAll('.hc-fold-section').forEach(section => {
    const trigger = section.querySelector('.hc-section-fold-toggle');
    const content = document.getElementById(trigger?.getAttribute('aria-controls') || '');
    if (!trigger || !content || !section.contains(content)) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isExpanded));
      content.hidden = isExpanded;
      section.classList.toggle('is-collapsed', isExpanded);
    });
  });
})();
