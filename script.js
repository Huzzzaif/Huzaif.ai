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

const traceData = document.querySelector('#sense-trace');
if (traceData) {
  const trace = JSON.parse(traceData.textContent);
  let exampleIndex = 0;
  let step = 'input';
  const content = document.querySelector('#trace-content');
  const buttons = document.querySelectorAll('[data-trace-step]');
  function renderTrace() {
    const sample = trace.examples[exampleIndex];
    content.replaceChildren();
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.traceStep === step)));
    content.append(element('p', 'trace-note', `${sample.label} · synthetic data`));
    if (step === 'matches') {
      sample.matches.forEach(match => {
        const row = element('div', 'trace-match');
        row.append(element('span', '', match.type), element('strong', '', match.span), element('small', '', `Cached pattern: ${match.pattern}`));
        content.append(row);
      });
      content.append(element('p', 'trace-note', `${sample.cache_hits} cache hits · ${sample.cache_misses} misses · no LLM called in this run`));
    } else {
      content.append(element('p', step === 'output' ? 'trace-output' : 'trace-text', sample[step]));
      content.append(element('p', 'trace-note', step === 'output' ? 'Sensitive spans replaced with encryption references. Original text successfully recovered during the recorded check.' : 'An email address and a phone number enter the pattern-cache component.'));
    }
    document.querySelector('#trace-example').textContent = `Try example ${exampleIndex === 0 ? 2 : 1} ↻`;
  }
  buttons.forEach(button => button.addEventListener('click', () => { step = button.dataset.traceStep; renderTrace(); }));
  document.querySelector('#trace-example').addEventListener('click', () => { exampleIndex = (exampleIndex + 1) % trace.examples.length; renderTrace(); });
  document.querySelector('.trace-controls').hidden = false;
  renderTrace();
}

document.querySelector('#year').textContent = String(new Date().getFullYear());
