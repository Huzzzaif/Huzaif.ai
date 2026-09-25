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


document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function whenVisible(node, callback) {
  if (!('IntersectionObserver' in window)) return callback();
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    callback();
  }, { threshold: 0.25 });
  observer.observe(node);
}

// Count headline numbers up once they scroll into view. The HTML already holds the final value.
document.querySelectorAll('[data-count]').forEach(node => {
  if (reduceMotion) return;
  const target = Number(node.dataset.count);
  const decimals = Number(node.dataset.decimals || 0);
  const format = value => node.dataset.format === 'comma' ? Math.round(value).toLocaleString('en-US') : value.toFixed(decimals);
  node.textContent = format(0);
  whenVisible(node, () => {
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / 1200);
      node.textContent = format(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
});

document.querySelectorAll('.latency-chart, .results-panel').forEach(chart => whenVisible(chart, () => chart.classList.add('is-visible')));

// Month-by-month career map, from the dates on the resume.
const CAREER = {
  start: [2021, 0],
  tracks: [
    { name: 'Industry', logo: 'logos/capgemini.svg', logoAlt: 'Capgemini', type: 't-ind', spans: [
      { from: [2021, 0], to: [2021, 3], lite: true, label: 'Full-Stack Developer Intern, Capgemini', note: 'Page load 6 s → 0.8 s' },
      { from: [2021, 6], to: [2023, 6], label: 'Senior Software Analyst, Capgemini', note: '3,000+ daily users · clock-in 2 s → 180 ms' }
    ] },
    { name: 'Research', logo: 'logos/csudh.svg', logoAlt: 'CSUDH research', type: 't-res', spans: [
      { from: [2024, 2], to: [2025, 11], label: 'Graduate Research Assistant, Security & Edge AI', note: 'Federated learning latency −46%' },
      { from: [2026, 0], to: null, lite: true, label: 'Graduate Research Assistant, VR/XR with AI', note: '5 → 50 headsets · first response ~350 ms' }
    ] },
    { name: 'M.S. · CSUDH', type: 't-edu', spans: [
      { from: [2023, 7], to: [2025, 4], label: 'M.S. Computer Science, CSUDH', note: 'GPA 3.95 / 4.0' }
    ] }
  ]
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function renderCareerMap(root) {
  const today = new Date();
  const total = (today.getFullYear() - CAREER.start[0]) * 12 + today.getMonth() - CAREER.start[1] + 1;
  const index = ([year, month]) => (year - CAREER.start[0]) * 12 + month - CAREER.start[1];
  const monthName = i => `${MONTHS[(CAREER.start[1] + i) % 12]} ${CAREER.start[0] + Math.floor((CAREER.start[1] + i) / 12)}`;
  const spanText = span => `${monthName(index(span.from))} – ${span.to ? monthName(index(span.to)) : 'now'}`;
  root.style.setProperty('--months', total);
  const load = new Array(total).fill(0);
  const caption = element('p', 'cm-caption');
  const defaultCaption = () => {
    caption.replaceChildren(document.createTextNode('Mar 2024 – May 2025 '), element('span', '', '· M.S. and applied research, side by side'));
  };
  const years = element('div', 'cm-years');
  years.append(element('span'));
  const yearCells = element('div');
  for (let y = CAREER.start[0]; y <= today.getFullYear(); y++) {
    const label = element('span', '', String(y));
    label.style.gridColumn = `span ${Math.min(12, total - (y - CAREER.start[0]) * 12)}`;
    yearCells.append(label);
  }
  years.append(yearCells);
  years.setAttribute('aria-hidden', 'true');
  root.append(years);
  CAREER.tracks.forEach(track => {
    const row = element('div', 'cm-row');
    const name = element('div', 'cm-name');
    if (track.logo) {
      const img = element('img');
      img.src = track.logo;
      img.alt = track.logoAlt;
      name.append(img);
    } else name.textContent = track.name;
    const cells = element('div', 'cm-cells');
    const owner = new Array(total).fill(null);
    track.spans.forEach(span => {
      const end = span.to ? index(span.to) : total - 1;
      for (let i = index(span.from); i <= end && i < total; i++) { owner[i] = span; load[i]++; }
    });
    owner.forEach((span, i) => {
      const cell = element('i');
      cell.style.setProperty('--d', `${(i * 12) / 1000}s`);
      if (span) {
        cell.className = track.type + (span.lite ? ' lite' : '');
        cell.dataset.on = '';
        const show = () => caption.replaceChildren(document.createTextNode(`${monthName(i)} · ${span.label} `), element('span', '', `· ${span.note}`));
        // Click covers taps on touch screens, where there is no hover.
        cell.addEventListener('mouseenter', show);
        cell.addEventListener('click', show);
        cell.addEventListener('mouseleave', defaultCaption);
      }
      cells.append(cell);
    });
    cells.setAttribute('aria-hidden', 'true');
    row.append(name, cells);
    root.append(row);
  });
  const heat = element('div', 'cm-row heat');
  const heatCells = element('div', 'cm-cells');
  load.forEach((count, i) => {
    const cell = element('i', count ? `h${Math.min(3, count + 1)}` : '');
    cell.style.setProperty('--d', `${(i * 12) / 1000 + 0.2}s`);
    const show = () => caption.replaceChildren(document.createTextNode(`${monthName(i)} `), element('span', '', `· ${count || 'no'} active track${count === 1 ? '' : 's'}`));
    cell.addEventListener('mouseenter', show);
    cell.addEventListener('click', show);
    cell.addEventListener('mouseleave', defaultCaption);
    heatCells.append(cell);
  });
  heatCells.setAttribute('aria-hidden', 'true');
  heat.append(element('div', 'cm-name', 'Combined'), heatCells);
  root.append(heat);
  const foot = element('div', 'cm-foot');
  const legend = element('div', 'cm-legend');
  legend.setAttribute('aria-hidden', 'true');
  legend.append(element('span', '', 'Less'));
  ['', 'h2', 'h3'].forEach(level => { const swatch = element('i'); swatch.style.background = `var(--heat-${level ? level[1] : 0})`; legend.append(swatch); });
  legend.append(element('span', '', 'More'));
  defaultCaption();
  foot.append(caption, legend);
  root.append(foot);
  const summary = element('ul', 'sr-only');
  CAREER.tracks.forEach(track => track.spans.forEach(span => summary.append(element('li', '', `${spanText(span)}: ${span.label}. ${span.note}.`))));
  root.append(summary);
  if (reduceMotion) root.classList.add('is-visible');
  else whenVisible(root, () => root.classList.add('is-visible'));
}
document.querySelectorAll('[data-career-map]').forEach(renderCareerMap);

document.querySelector('#year').textContent = String(new Date().getFullYear());
