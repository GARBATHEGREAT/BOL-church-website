document.querySelector('#contact-form')?.addEventListener('submit', event => {
  event.preventDefault();
  event.currentTarget.querySelector('.form-note').textContent = 'Thank you! Your message has been received in this demo.';
  event.currentTarget.reset();
});

const verses = [...document.querySelectorAll('.verse')];
let verseIndex = 0;
function showVerse(next) {
  verses[verseIndex]?.classList.remove('active');
  verseIndex = (next + verses.length) % verses.length;
  verses[verseIndex]?.classList.add('active');
}
document.querySelector('.verse-arrow.next')?.addEventListener('click', () => showVerse(verseIndex + 1));
document.querySelector('.verse-arrow.prev')?.addEventListener('click', () => showVerse(verseIndex - 1));
if (verses.length) setInterval(() => showVerse(verseIndex + 1), 6500);

const revealTargets = document.querySelectorAll('.section:not(.hero),.impact-strip');
revealTargets.forEach(element => element.classList.add('scroll-reveal'));
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }
}), { threshold: .12 });
revealTargets.forEach(element => revealObserver.observe(element));

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const element = entry.target;
  const target = Number(element.dataset.count);
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / 1200, 1);
    element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  counterObserver.unobserve(element);
}), { threshold: .5 });
counters.forEach(element => counterObserver.observe(element));

const topButton = document.querySelector('.to-top');
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
window.addEventListener('scroll', () => {
  topButton?.classList.toggle('show', scrollY > 500);
  let current = '';
  sections.forEach(section => { if (scrollY >= section.offsetTop - 180) current = section.id; });
  navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + current));
}, { passive: true });
topButton?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
