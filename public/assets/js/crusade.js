/* Announcement popup (version 1: the crusade).
   Opens when the homepage loads. Text, flyers, account details and timing come from
   Admin > Announcement; the defaults below are used if Admin data cannot be reached. */
(function () {
  var modal = document.querySelector('[data-crusade-modal]');
  if (!modal) return;

  var DEFAULT_SLIDES = [
    {src: 'assets/images/crusade/crusade-1.jpg', alt: 'Crusade flyer: Let There Be Light, 25th to 27th November 2026, 5:00 PM daily, Bread of Life Auditorium, Kurudu, Abuja'},
    {src: 'assets/images/crusade/crusade-2.jpg', alt: 'Crusade flyer in blue: A 3-day crusade, Let There Be Light, 25th to 27th November 2026'},
    {src: 'assets/images/crusade/crusade-3.jpg', alt: 'Crusade flyer in light colours: A 3-day crusade, Let There Be Light, 25th to 27th November 2026'},
    {src: 'assets/images/crusade/crusade-4.jpg', alt: 'Crusade flyer in gold and navy: A 3-day crusade, Let There Be Light, 25th to 27th November 2026'}
  ];

  var DEFAULTS = {
    announce_enabled: '1',
    announce_version: 'v1',
    announce_end_date: '2026-11-27',
    announce_interval: '5',
    announce_kicker: 'You are invited',
    announce_title: 'A 3-Day Crusade:',
    announce_title_accent: 'Let There Be Light',
    announce_theme: 'Genesis 1:3 · “And God said, Let there be light: and there was light.”',
    announce_when: '25th, 26th & 27th November 2026 · 5:00 PM daily',
    announce_venue: 'Bread of Life Auditorium, Behind LEA Primary School, Kurudu, FCT Abuja',
    announce_ministering: 'Sis. Josephine Garba & other anointed men of God',
    announce_featuring: 'Salvation · Deliverance · Divine Breakthrough · Fruitfulness · Healing · Restoration',
    announce_phones: '08138650476, 08100181370, 08023734216',
    announce_account_heading: 'Ministry account',
    announce_bank: 'Zenith Bank',
    announce_account_name: 'Bread of Life Divine Covenant Ministry',
    announce_account_number: '1016540285',
    announce_directions_url: 'https://www.google.com/maps/search/?api=1&query=LEA+Primary+School+Kurudu+Abuja'
  };

  var S = {}, slides = [], index = 0, timer = null, paused = false, userStopped = false;
  var card = modal.querySelector('.crusade-card');
  var track = modal.querySelector('[data-crusade-track]');
  var dotsBox = modal.querySelector('[data-crusade-dots]');
  var prevBtn = modal.querySelector('[data-crusade-prev]');
  var nextBtn = modal.querySelector('[data-crusade-next]');
  var closeBtn = modal.querySelector('.crusade-close');
  var lastFocus = null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function q(name) { return modal.querySelector('[data-crusade-' + name + ']'); }
  function setText(name, value) { var el = q(name); if (el && value) el.textContent = value; }

  /* ---------- data ---------- */
  function load() {
    var fallback = {settings: {}, slides: DEFAULT_SLIDES};
    if (!window.fetch) return Promise.resolve(fallback);
    var request = fetch('/api/content?updated=' + Date.now(), {cache: 'no-store'})
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return fallback;
        var settings = data.settings || {};
        var out = {settings: settings, slides: DEFAULT_SLIDES};
        // Once the admin has opened the Announcement tab, the saved flyers replace the defaults.
        if (settings.announce_slides_initialized === '1') {
          out.slides = (data.contentItems || [])
            .filter(function (item) { return item.section === 'announcement_slides' && item.image_url; })
            .map(function (item) { return {src: item.image_url, alt: item.title || 'Announcement flyer'}; });
        }
        return out;
      })
      .catch(function () { return fallback; });
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(fallback); }, 2500); });
    return Promise.race([request, timeout]);
  }

  /* ---------- rendering ---------- */
  function applyText() {
    setText('kicker', S.announce_kicker);
    setText('title', S.announce_title);
    setText('accent', S.announce_title_accent);
    setText('theme', S.announce_theme);
    setText('when', S.announce_when);
    setText('venue', S.announce_venue);
    setText('ministering', S.announce_ministering);
    setText('featuring', S.announce_featuring);
    setText('account-heading', S.announce_account_heading);
    setText('bank', S.announce_bank);
    setText('account-name', S.announce_account_name);
    setText('number', S.announce_account_number);

    var account = q('account');
    if (account) account.hidden = !S.announce_account_number;

    var directions = q('directions');
    if (directions && S.announce_directions_url) directions.href = S.announce_directions_url;

    var phones = (S.announce_phones || '').split(/[\n,•|]+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var holder = q('phones');
    if (holder) {
      holder.textContent = '';
      phones.forEach(function (phone, i) {
        if (i) holder.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.textContent = phone;
        a.href = 'tel:' + toDialNumber(phone);
        holder.appendChild(a);
      });
    }
    var call = q('call');
    if (call) {
      if (phones.length) call.href = 'tel:' + toDialNumber(phones[0]);
      else call.hidden = true;
    }
  }

  function toDialNumber(phone) {
    var digits = phone.replace(/[^\d+]/g, '');
    return digits.charAt(0) === '0' ? '+234' + digits.slice(1) : digits;
  }

  function buildSlider() {
    track.textContent = '';
    dotsBox.textContent = '';
    slides.forEach(function (slide, i) {
      var img = document.createElement('img');
      img.src = slide.src;
      img.alt = slide.alt;
      img.width = 1600;
      img.height = 901;
      if (i > 0) img.loading = 'lazy';
      img.className = i === 0 ? 'is-active' : '';
      img.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      track.appendChild(img);

      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Show flyer ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () { go(i, true); });
      dotsBox.appendChild(dot);
    });
    var multiple = slides.length > 1;
    prevBtn.hidden = nextBtn.hidden = !multiple;
    dotsBox.hidden = !multiple;
    q('slider').hidden = slides.length === 0;
    index = 0;
    mark();
  }

  function mark() {
    var imgs = track.children;
    for (var i = 0; i < imgs.length; i++) {
      var on = i === index;
      imgs[i].classList.toggle('is-active', on);
      imgs[i].setAttribute('aria-hidden', on ? 'false' : 'true');
      if (dotsBox.children[i]) {
        dotsBox.children[i].classList.toggle('is-active', on);
        if (on) dotsBox.children[i].setAttribute('aria-current', 'true');
        else dotsBox.children[i].removeAttribute('aria-current');
      }
    }
    var dl = q('download');
    if (dl && slides[index]) dl.href = slides[index].src;
  }

  function go(i, manual) {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    mark();
    if (manual) restart();
  }

  /* ---------- autoplay ---------- */
  function intervalMs() {
    var s = parseFloat(S.announce_interval);
    if (!isFinite(s)) s = 5;
    return Math.min(30, Math.max(2, s)) * 1000;
  }
  function start() {
    stop();
    if (slides.length < 2 || reduceMotion || userStopped) return;
    timer = setInterval(function () { if (!paused && !document.hidden) go(index + 1); }, intervalMs());
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { start(); }

  /* ---------- show / hide ---------- */
  function dismissKey() { return 'announcement-dismissed-' + (S.announce_version || 'v1'); }

  function expired() {
    var end = S.announce_end_date;
    if (!end) return false;
    var d = new Date(end + 'T23:59:59+01:00'); // end of that day, Nigeria time
    return !isNaN(d) && new Date() > d;
  }

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('crusade-open');
    closeBtn.focus();
    start();
  }

  function close() {
    modal.hidden = true;
    stop();
    document.body.classList.remove('crusade-open');
    try { sessionStorage.setItem(dismissKey(), '1'); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- events ---------- */
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-crusade-close]')) close();
  });
  prevBtn.addEventListener('click', function () { go(index - 1, true); });
  nextBtn.addEventListener('click', function () { go(index + 1, true); });

  var sliderEl = q('slider');
  sliderEl.addEventListener('mouseenter', function () { paused = true; });
  sliderEl.addEventListener('mouseleave', function () { paused = false; });
  sliderEl.addEventListener('focusin', function () { paused = true; });
  sliderEl.addEventListener('focusout', function () { paused = false; });

  var startX = null;
  sliderEl.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; paused = true; }, {passive: true});
  sliderEl.addEventListener('touchend', function (e) {
    paused = false;
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true);
  }, {passive: true});

  var copyBtn = q('copy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var number = (S.announce_account_number || '').trim();
    function done() {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(function () { copyBtn.textContent = 'Copy number'; }, 2200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(number).then(done, fallbackCopy);
    } else fallbackCopy();
    function fallbackCopy() {
      var t = document.createElement('textarea');
      t.value = number; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(t);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') return close();
    if (e.key === 'ArrowLeft') return go(index - 1, true);
    if (e.key === 'ArrowRight') return go(index + 1, true);
    if (e.key === 'Tab') { // keep keyboard focus inside the popup
      var f = card.querySelectorAll('a[href]:not([hidden]),button:not([disabled]):not([hidden])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  document.addEventListener('visibilitychange', function () { if (!document.hidden && !modal.hidden) start(); });

  /* ---------- go ---------- */
  load().then(function (result) {
    S = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var v = result.settings[k];
      S[k] = (v !== undefined && v !== null && String(v).trim() !== '') ? String(v).trim() : DEFAULTS[k];
    });
    // An explicitly emptied field in Admin should hide that item rather than fall back to the default.
    ['announce_account_number', 'announce_phones'].forEach(function (k) {
      if (result.settings[k] !== undefined && String(result.settings[k]).trim() === '') S[k] = '';
    });

    if (S.announce_enabled === '0' || expired()) return;

    slides = result.slides;
    applyText();
    buildSlider();

    // Permanent strip at the top of the homepage: stays after the popup is closed.
    var strip = document.querySelector('[data-crusade-strip]');
    if (strip) {
      var stripText = strip.querySelector('[data-crusade-strip-text]');
      if (stripText) stripText.textContent = (S.announce_title + ' ' + S.announce_title_accent + ' · ' + S.announce_when).trim();
      strip.hidden = false;
      strip.addEventListener('click', function () { if (modal.hidden) open(); });
    }

    try { if (sessionStorage.getItem(dismissKey())) return; } catch (e) {}
    setTimeout(open, 400);
  });
})();
