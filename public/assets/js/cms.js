/* Loads easy file settings, then applies changes saved through Admin. */
(async function () {
  applySettings(window.CHURCH_SITE_SETTINGS || {});
  try {
    const response = await fetch('/api/content');
    if (!response.ok) return;
    const data = await response.json();
    const saved = data.settings || {};
    applySettings({
      tagline: saved.hero_tagline,
      pastorName: saved.pastor_name,
      pastorTitle: saved.pastor_title,
      address: saved.church_address,
      phone: saved.church_phone,
      email: saved.church_email,
      youtubeChannel: saved.youtube_channel
    });
    showRandomSermon(data.sermons || [], saved.pastor_title);
    showEvents(data.events || []);
  } catch {
    console.info('Using default website settings.');
  }
})();

function applySettings(settings) {
  setText('.hero-content > p:not(.eyebrow)', settings.tagline);
  setText('.speaker b', settings.pastorName);
  setText('.speaker small', settings.pastorTitle);

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

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value || '';
  return element.innerHTML;
}
