// Small dependency-free script: header (mobile menu, scroll state, current section), language choice, form submission.

const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#nav');

// Mobile menu
function closeMenu() {
  if (!nav || !toggle) return;
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  // Close the menu after a link is clicked, on Escape, or on a click outside the header
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) closeMenu();
  });
}

// Header gets a shadow once the page has scrolled
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Current section: highlights the matching nav link (aria-current="location")
const links = document.querySelectorAll('.nav__links a[href^="#"]');
const sections = document.querySelectorAll('.hero, main section[id]');

if (links.length && sections.length && 'IntersectionObserver' in window) {
  const setCurrent = (id) => {
    links.forEach((a) => {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  };

  // A thin band near the middle of the viewport: the section crossing it is "current"
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setCurrent(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach((section) => observer.observe(section));
}

// Language switch: remember the visitor's choice, so a returning FR visitor lands on the French home page
document.querySelectorAll('.lang-switch').forEach((link) => {
  link.addEventListener('click', () => {
    try { localStorage.setItem('nox-lang', link.hreflang); } catch (e) {}
  });
});

// Scoping-note card: "E-mail us" brings the form into view and puts the cursor in it
document.querySelectorAll('[data-open-form]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector('#contact-form');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const first = target.querySelector('input, textarea');
    if (first) first.focus({ preventScroll: true });
  });
});

// Pilot page and home page: on mobile, the booking button is pinned to the bottom once the first block is out of view, and hidden at the final block
const stickyCta = document.querySelector('[data-sticky-cta]');
if (stickyCta && 'IntersectionObserver' in window) {
  let pastHero = false;
  let atEnd = false;
  const update = () => stickyCta.classList.toggle('is-visible', pastHero && !atEnd);
  const hero = document.querySelector('.page-hero, .hero');
  const end = document.querySelector('[data-pilot-end], [data-sticky-end]');
  if (hero) new IntersectionObserver(([entry]) => { pastHero = !entry.isIntersecting; update(); }).observe(hero);
  if (end) new IntersectionObserver(([entry]) => { atEnd = entry.isIntersecting; update(); }).observe(end);
}

// Form: background submission (works with Formspree, Getform, Basin…)
const form = document.querySelector('#contact-form');

if (form) {
  const status = form.querySelector('.form__status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = status.dataset.sending;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = status.dataset.ok;
    } catch (err) {
      status.textContent = status.dataset.error;
    }
  });
}

// Case studies: highlight the table-of-contents entry of the section being read
const toc = document.querySelector('[data-toc]');
if (toc && 'IntersectionObserver' in window) {
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const visible = new Set();
  const update = () => {
    // The active section is the first one (in page order) that crosses the reading band
    const current = targets.find((el) => visible.has(el));
    if (!current) return;
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    update();
  }, { rootMargin: '-30% 0px -60% 0px' });
  targets.forEach((el) => io.observe(el));
}

// Home hero screen: the before/after loop is a CSS animation (css/style.css, .shot).
// Pause it while the screen is out of view, so it plays from where the visitor left it.
const shot = document.querySelector('[data-sweep]');
if (shot && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    shot.classList.toggle('is-waiting', !entry.isIntersecting);
  }, { threshold: 0.6 }).observe(shot);
}

// Fatigue case study: the compact chart opens the four-signal chart in a dialog (close: ×, Escape, or a click outside)
document.querySelectorAll('[data-drv-open]').forEach((button) => {
  const dialog = button.closest('figure').querySelector('[data-drv-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  button.addEventListener('click', () => dialog.showModal());
  const close = dialog.querySelector('[data-drv-close]');
  if (close) close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
});
