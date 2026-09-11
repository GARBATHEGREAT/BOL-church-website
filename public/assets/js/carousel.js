(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function visibleCount(carousel) {
    if (carousel.dataset.carousel === 'visit') return 1;
    return window.innerWidth >= 820 ? 2 : 1;
  }

  function initialise(carousel) {
    if (!carousel) return;
    if (carousel._churchCarouselCleanup) carousel._churchCarouselCleanup();
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...carousel.querySelectorAll('.carousel-slide')];
    const dots = carousel.querySelector('[data-carousel-dots]');
    const previous = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');
    if (!track || !slides.length) return;

    let index = 0;
    let timer;
    let touchStart = 0;
    let count = visibleCount(carousel);
    const maximum = () => Math.max(0, slides.length - count);

    function render(animate = true) {
      count = visibleCount(carousel);
      index = Math.min(index, maximum());
      track.style.transitionDuration = reduceMotion.matches || !animate ? '0ms' : '';
      track.style.transform = `translate3d(-${index * (100 / count)}%,0,0)`;
      if (dots) [...dots.children].forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      if (previous) previous.disabled = slides.length <= count;
      if (next) next.disabled = slides.length <= count;
    }

    function go(step) {
      const max = maximum();
      index = max ? (index + step + max + 1) % (max + 1) : 0;
      render();
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (!reduceMotion.matches && slides.length > count) timer = setInterval(() => go(1), 6500);
    }

    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i <= maximum(); i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => { index = i; render(); restart(); });
        dots.appendChild(dot);
      }
    }

    const onPrevious = () => go(-1);
    const onNext = () => go(1);
    const onResize = () => { if (dots) initialise(carousel); else render(false); };
    const pause = () => clearInterval(timer);
    const resume = () => restart();
    const touchBegin = event => { touchStart = event.changedTouches[0].clientX; };
    const touchEnd = event => {
      const distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) > 45) go(distance > 0 ? -1 : 1);
    };
    previous?.addEventListener('click', onPrevious);
    next?.addEventListener('click', onNext);
    carousel.addEventListener('mouseenter', pause);
    carousel.addEventListener('mouseleave', resume);
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', resume);
    carousel.addEventListener('touchstart', touchBegin, {passive:true});
    carousel.addEventListener('touchend', touchEnd, {passive:true});
    window.addEventListener('resize', onResize);
    render(false);
    restart();

    carousel._churchCarouselCleanup = () => {
      clearInterval(timer);
      previous?.removeEventListener('click', onPrevious);
      next?.removeEventListener('click', onNext);
      carousel.removeEventListener('mouseenter', pause);
      carousel.removeEventListener('mouseleave', resume);
      carousel.removeEventListener('focusin', pause);
      carousel.removeEventListener('focusout', resume);
      carousel.removeEventListener('touchstart', touchBegin);
      carousel.removeEventListener('touchend', touchEnd);
      window.removeEventListener('resize', onResize);
    };
  }

  window.initChurchCarousel = initialise;
  window.initChurchCarousels = () => document.querySelectorAll('[data-carousel]').forEach(initialise);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.initChurchCarousels);
  else window.initChurchCarousels();
})();
