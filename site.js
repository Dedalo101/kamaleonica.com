const INSTAGRAM_URL = 'https://www.instagram.com/kamaleonica';
const CONTACT_EMAIL = 'hello@kamaleonica.art';
const ACCENTS = ['#FF00AA', '#E91E63', '#D4AF37', '#13B9C8', '#4E217B'];

function setAccentFromTime() {
  const idx = Math.floor(Date.now() * 0.00035) % ACCENTS.length;
  document.documentElement.style.setProperty('--accent', ACCENTS[idx]);
}

function initLinks() {
  document.querySelectorAll('[data-link]').forEach((link) => {
    const target = link.dataset.link;
    if (target === 'instagram') link.href = INSTAGRAM_URL;
    if (target === 'email') link.href = `mailto:${CONTACT_EMAIL}`;
  });
}

function init() {
  setAccentFromTime();
  setInterval(setAccentFromTime, 1400);
  initLinks();
  document.body.classList.add('is-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
