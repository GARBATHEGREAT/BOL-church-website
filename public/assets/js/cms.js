/* Loads easy file settings, then applies changes saved through Admin. */
(async function () {
  applySettings(window.CHURCH_SITE_SETTINGS || {});
  try {
    const response = await fetch('/api/content');
    if (!response.ok) return;
    const data = await response.json();
    const saved = data.settings || {};
    applySettings({
      announcementText: saved.announcement_text,
      announcementLinkText: saved.announcement_link_text,
      sundayTimes: saved.sunday_times,
      wednesdayTime: saved.wednesday_time,
      fridayTime: saved.friday_time,
      heroWelcome: saved.hero_welcome,
      heroHeading: saved.hero_heading,
      heroAccent: saved.hero_accent,
      tagline: saved.hero_tagline,
      aboutHeading: saved.about_heading,
      aboutAccent: saved.about_accent,
      aboutText: saved.about_text,
      visitKicker: saved.visit_kicker,
      visitHeading: saved.visit_heading,
      visitText: saved.visit_text,
      visitButton: saved.visit_button,
      pastorName: saved.pastor_name,
      pastorTitle: saved.pastor_title,
      address: saved.church_address,
      phone: saved.church_phone,
      email: saved.church_email,
      youtubeChannel: saved.youtube_channel
    });
    applyImpact(saved);
    showRandomSermon(data.sermons || [], saved.pastor_title);
    showEvents(data.events || []);
  } catch {
    console.info('Using default website settings.');
  }
})();

function applySettings(settings) {
  setText('.announcement', settings.announcementText, true);
  setText('.announcement a', settings.announcementLinkText);
  setText('.nav-meta b', settings.sundayTimes);
  setText('.service-pill b', settings.sundayTimes);
  setText('.hero .eyebrow', settings.heroWelcome, true);
  setText('.hero h1', settings.heroHeading, true);
  setText('.hero h1 em', settings.heroAccent);
  setText('.hero-content > p:not(.eyebrow)', settings.tagline);
  setText('.welcome-grid h2', settings.aboutHeading, true);
  setText('.welcome-grid h2 em', settings.aboutAccent);
  setText('.welcome-grid .lead', settings.aboutText);
  setText('.visit-copy .section-kicker', settings.visitKicker);
  setText('.visit-copy h2', settings.visitHeading);
  setText('.visit-copy > p', settings.visitText);
  setText('.visit-copy > .button', settings.visitButton);
  setText('.speaker b', settings.pastorName);
  setText('.speaker small', settings.pastorTitle);
  const services = document.querySelectorAll('.service-list > div');
  if (services[0] && settings.sundayTimes) services[0].querySelector('b').textContent = settings.sundayTimes;
  if (services[1] && settings.wednesdayTime) services[1].querySelector('b').textContent = settings.wednesdayTime;
  if (services[2] && settings.fridayTime) services[2].querySelector('b').textContent = settings.fridayTime;

  if (settings.youtubeChannel) {
    document.querySelectorAll('a[href*="youtube.com"]').forEach(function (link) {
      link.href = settings.youtubeChannel;
    });
  }

  const contact = document.querySelectorAll('.contact-details span');
  if (contact[0] && settings.address) contact[0].textContent = settings.address;
  if (contact[1] && (settings.phone || settings.email)) {
    contact[1].innerHTML = escapeHtml(settings.phone || '') + '<br>' + escapeHtml(settings.email || '');
  }
}

function applyImpact(saved) {
  document.querySelectorAll('.impact-strip > div').forEach(function (item, index) {
    const number = saved['impact_' + (index + 1) + '_number'];
    const label = saved['impact_' + (index + 1) + '_label'];
    const counter = item.querySelector('b');
    if (counter && number) {
      counter.dataset.count = String(Math.max(0, Number(number) || 0));
      counter.textContent = '0';
    }
    if (label) item.querySelector('span').textContent = label;
  });
}

function showRandomSermon(sermons, pastorTitle) {
  if (!sermons.length) return;
  const sermon = sermons[Math.floor(Math.random() * sermons.length)];
  const video = document.querySelector('.video-wrap iframe');
  if (video) video.src = 'https://www.youtube.com/embed/' + sermon.youtube_id;
  setText('.message-copy h3', sermon.title);
  setText('.speaker b', sermon.pastor);
  setText('.speaker small', (pastorTitle || 'Speaker') + ' · ' + sermon.duration);
}

function showEvents(events) {
  const list = document.querySelector('.events-list');
  if (!list || !events.length) return;
  list.innerHTML = events.slice(0, 3).map(function (event) {
    const date = new Date(event.event_date + 'T00:00:00');
    return '<article><div class="date"><b>' +
      String(date.getDate()).padStart(2, '0') + '</b><span>' +
      date.toLocaleString('en', {month:'short'}).toUpperCase() +
      '</span></div><div><span class="tag gold">Event</span><h3>' +
      escapeHtml(event.title) + '</h3><p>' + escapeHtml(event.event_time) +
      ' · ' + escapeHtml(event.location || 'Church Auditorium') +
      '</p></div><a href="#contact">↗</a></article>';
  }).join('');
}

function setText(selector, value, preserveChild) {
  const element = document.querySelector(selector);
  if (!element || !value) return;
  if (preserveChild) {
    const child = element.querySelector('a,em,span');
    const textNode = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (textNode) textNode.textContent = value + (child ? ' ' : '');
    return;
  }
  element.textContent = value;
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value || '';
  return element.innerHTML;
}
