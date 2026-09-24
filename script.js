'use strict';

const guide = document.querySelector('#guide');
const guideInput = document.querySelector('#guide-input');
const answer = document.querySelector('#guide-answer');
const knowledge = window.PORTFOLIO_KNOWLEDGE || [];
let previousFocus;

function openGuide() {
  if (guide.open) return;
  previousFocus = document.activeElement;
  guide.showModal();
  document.body.classList.add('guide-open');
  document.querySelector('#close-guide').focus();
}

function closeGuide() {
  guide.close();
}

guide.addEventListener('close', () => {
  document.body.classList.remove('guide-open');
  if (previousFocus && previousFocus.isConnected) previousFocus.focus();
});

document.querySelector('#close-guide').addEventListener('click', closeGuide);
guide.addEventListener('click', event => {
  if (event.target !== guide) return;
  const rect = guide.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeGuide();
});

document.querySelectorAll('[data-open-guide]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', openGuide);
});

function normalize(text) {
  return text.toLowerCase().replace(/[’']/g, '').replace(/[-–—]/g, ' ').replace(/[^a-z0-9.,% ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function chooseAnswer(question) {
  const normalized = normalize(question);
  // Limit this prototype to documented subjects. No generated claims or role-fit scores.
  if (/\b(salary|visa|sponsor|citizen|age|married|religion|address|phone|job description|match score|fit for|weakness|reference|recommendation)\b/.test(normalized)) return null;
  const ranked = knowledge.map(entry => {
    const score = entry.match.reduce((sum, phrase) => {
      const term = normalize(phrase);
      const found = term.includes(' ') ? normalized.includes(term) : normalized.split(' ').some(word => word === term || (term.length > 4 && word.startsWith(term)));
      return sum + (found ? Math.max(1, term.length) : 0);
    }, 0);
    // A specific project or skill takes precedence over a generic introduction.
    return { entry, score: entry.id === 'intro' ? score / 10 : score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 0 ? ranked[0].entry : null;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function sourceLink(source) {
  const link = element('a', '', source.label);
  link.href = source.href;
  if (/^https?:/.test(source.href) || source.href.endsWith('.pdf')) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  return link;
}

function showAnswer(question) {
  const entry = chooseAnswer(question);
  answer.replaceChildren();
  answer.append(element('p', 'answer-question', question));
  answer.append(element('h3', 'answer-title', entry?.title || 'That needs an answer from Huzaif.'));
  answer.append(element('p', 'answer-body', entry?.text || 'This guide covers documented projects, experience, research, and education. I don’t have a reviewed answer to that question. You can explore the background page or ask Huzaif directly.'));
  const links = element('div', 'answer-links');
  (entry?.links || [{ label: 'Read the background', href: 'about.html' }, { label: 'Email Huzaif', href: 'mailto:huzaiffkhhan@gmail.com' }]).forEach(source => {
    const link = sourceLink(source);
    const arrow = element('span', '', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    links.append(link);
  });
  answer.append(links);
  if (entry) {
    const sources = element('p', 'answer-source', 'Sources: ');
    entry.sources.forEach((source, index) => {
      if (index) sources.append(document.createTextNode(' · '));
      sources.append(sourceLink(source));
    });
    answer.append(sources);
  }
  // Scroll only the panel; keep the visitor's place in the portfolio.
  const scrollArea = document.querySelector('.guide-scroll');
  scrollArea.scrollTo({ top: answer.offsetTop - scrollArea.offsetTop - 18, behavior: 'instant' });
}

document.querySelectorAll('[data-question]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => {
    openGuide();
    showAnswer(button.dataset.question);
  });
});

document.querySelector('#guide-form').addEventListener('submit', event => {
  event.preventDefault();
  const question = guideInput.value.trim();
  if (!question) return;
  showAnswer(question);
  guideInput.value = '';
});

const privacyToggle = document.querySelector('#privacy-toggle');
if (privacyToggle) {
  privacyToggle.hidden = false;
  privacyToggle.addEventListener('click', () => {
    const protectedText = privacyToggle.getAttribute('aria-pressed') !== 'true';
    privacyToggle.setAttribute('aria-pressed', String(protectedText));
    document.querySelector('#sample-name').textContent = protectedText ? '[PERSON]' : 'Alex Morgan';
    document.querySelector('#sample-email').textContent = protectedText ? '[EMAIL]' : 'alex@example.com';
    document.querySelector('.demo-sentence').classList.toggle('protected', protectedText);
    document.querySelector('#demo-status').textContent = protectedText ? 'Illustrative protected output' : 'Synthetic text · no real personal data';
    privacyToggle.textContent = protectedText ? 'Show original text ↶' : 'Show protected text →';
  });
}

document.querySelector('#year').textContent = String(new Date().getFullYear());
