'use strict';

// Local illustrations explain the projects without implying live inference.
const modes = document.querySelectorAll('[data-mode]');
const graph = document.querySelector('#lineage-graph');
const question = document.querySelector('#lineage-question');
const finding = document.querySelector('#finding-text');
modes.forEach(button => {
  button.addEventListener('click', () => {
    const root = button.dataset.mode === 'root';
    modes.forEach(item => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    graph.classList.toggle('reverse', root);
    question.innerHTML = root
      ? 'A model’s predictions change.<br><strong>Where did the problem start?</strong>'
      : 'A payments column changes.<br><strong>What breaks downstream?</strong>';
    finding.innerHTML = root
      ? '<strong>Follow the evidence upstream.</strong> Trace dependencies and rank possible causes before saving the investigation.'
      : '<strong>Keep the finding, not just the answer.</strong> Write evidence back into the catalog for future investigations.';
  });
});

const privacyToggle = document.querySelector('#privacy-toggle');
privacyToggle.addEventListener('click', () => {
  const protectedText = privacyToggle.getAttribute('aria-pressed') !== 'true';
  privacyToggle.setAttribute('aria-pressed', String(protectedText));
  document.querySelector('#sample-name').textContent = protectedText ? '[PERSON]' : 'Alex Morgan';
  document.querySelector('#sample-email').textContent = protectedText ? '[EMAIL]' : 'alex@example.com';
  document.querySelector('.sample-text').classList.toggle('protected', protectedText);
  document.querySelector('#privacy-state').textContent = protectedText ? 'Illustrative protected output' : '2 example PII spans';
  privacyToggle.textContent = protectedText ? 'Show original text ↶' : 'Show protected text →';
});

document.querySelector('#year').textContent = String(new Date().getFullYear());

if ('IntersectionObserver' in window) {
  const links = document.querySelectorAll('nav a');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach(link => {
        if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -55% 0px' });
  document.querySelectorAll('#work, #experience, #research, #about').forEach(section => observer.observe(section));
}
