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
      leaderName: saved.leader_name,
      leaderTitle: saved.leader_title,
      address: saved.church_address,
      phone: saved.church_phone,
      email: saved.church_email,
      youtubeChannel: saved.youtube_channel,
      instagramUrl: saved.instagram_url,
      facebookUrl: saved.facebook_url,
      tiktokUrl: saved.tiktok_url,
      xUrl: saved.x_url,
      whatsappUrl: saved.whatsapp_url
    });
    applySectionSettings(saved);
    applyImpact(saved);
    showRandomSermon(data.sermons || [], saved.pastor_title);
    showEvents(data.events || []);
    applyManagedContent(data.contentItems || []);
  } catch {
    console.info('Using default website settings.');
  }
})();

function applySectionSettings(saved) {
  const values = [
    ['.leadership-intro .section-kicker','leadership_kicker'],['.leadership-intro h2','leadership_heading'],['.leadership-intro p','leadership_text'],
    ['.ministries .section-kicker','community_kicker'],['.ministries h2','community_heading'],['.ministries .centered > p','community_text'],
    ['.sermons .section-kicker','messages_kicker'],['.sermons .section-head h2','messages_heading'],
    ['.events .section-kicker','events_kicker'],['.events .section-head h2','events_heading']
    ,['.stories .section-kicker','stories_kicker'],['.stories-heading h2','stories_heading'],['.stories-heading > p','stories_text'],['.story-card blockquote','story_quote'],['.story-person b','story_person']
    ,['.give .section-kicker','giving_kicker'],['.give h2','giving_heading'],['.give > div:last-child > p','giving_text'],['.give .button','giving_button']
    ,['.contact .section-kicker','contact_kicker'],['.contact h2','contact_heading'],['.contact > div > p','contact_text'],['#contact-form button','contact_button']
  ];
  values.forEach(([selector,key]) => setText(selector,saved[key]));
  if (saved.maps_url) document.querySelectorAll('[data-map-link]').forEach(link => link.href = saved.maps_url);
  if (saved.giving_url) document.querySelectorAll('[data-giving-link]').forEach(link => link.href = saved.giving_url);
}

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
  setText('[data-pastor-name]', settings.pastorName);
  setText('[data-pastor-title]', settings.pastorTitle);
  setText('[data-leader-name]', settings.leaderName);
  setText('[data-leader-title]', settings.leaderTitle);
  const services = document.querySelectorAll('.service-list > div');
  if (services[0] && settings.sundayTimes) services[0].querySelector('b').textContent = settings.sundayTimes;
  if (services[1] && settings.wednesdayTime) services[1].querySelector('b').textContent = settings.wednesdayTime;
  if (services[2] && settings.fridayTime) services[2].querySelector('b').textContent = settings.fridayTime;

  if (settings.youtubeChannel) {
    document.querySelectorAll('a[href*="youtube.com"]').forEach(function (link) {
      link.href = settings.youtubeChannel;
    });
  }
  setSocialLink('youtube', settings.youtubeChannel);
  setSocialLink('instagram', settings.instagramUrl);
  setSocialLink('facebook', settings.facebookUrl);
  setSocialLink('tiktok', settings.tiktokUrl);
  setSocialLink('x', settings.xUrl);
  setSocialLink('whatsapp', settings.whatsappUrl);

  const contact = document.querySelectorAll('.contact-details span');
  if (contact[0] && settings.address) contact[0].textContent = settings.address;
  if (contact[1] && (settings.phone || settings.email)) {
    contact[1].innerHTML = escapeHtml(settings.phone || '') + '<br>' + escapeHtml(settings.email || '');
  }
}

function setSocialLink(network, value) {
  document.querySelectorAll('[data-social="' + network + '"]').forEach(function (link) {
    link.hidden = !value;
    if (value) link.href = value;
  });
}

function applyManagedContent(items) {
  const grouped = items.reduce(function (result, item) {
    (result[item.section] ||= []).push(item);
    return result;
  }, {});
  renderHero(grouped.hero_slides || []);
  renderCarousel('[data-carousel="word"]', grouped.word_slides || [], renderWordSlide);
  renderCarousel('[data-carousel="pastors"]', grouped.pastors || [], renderPastorSlide);
  renderCommunities(grouped.communities || []);
  renderCarousel('[data-carousel="visit"]', grouped.visit_slides || [], renderVisitSlide);
}

function renderHero(items) {
  if (!items.length) return;
  const stage = document.querySelector('[data-hero-backgrounds]');
  if (!stage) return;
  stage.innerHTML = items.map(function (item, index) {
    return '<div class="hero-bg' + (index === 0 ? ' active' : '') + '" style="background-image:url(&quot;' + escapeAttribute(item.image_url) + '&quot;)"></div>';
  }).join('');
  const first = items[0];
  setText('.hero .eyebrow', first.subtitle || 'Welcome home', true);
  const heading = document.querySelector('.hero h1');
  if (heading && first.title) heading.innerHTML = splitHeading(first.title);
  setText('.hero-content > p:not(.eyebrow)', first.description);
  const button = document.querySelector('.hero-actions .primary');
  if (button && first.button_text) button.textContent = first.button_text;
  if (button && first.button_url) button.href = first.button_url;
  if (items.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let active = 0;
    setInterval(function () {
      const backgrounds = stage.querySelectorAll('.hero-bg');
      backgrounds[active]?.classList.remove('active');
      active = (active + 1) % backgrounds.length;
      backgrounds[active]?.classList.add('active');
    }, 8000);
  }
}

function renderCarousel(selector, items, renderer) {
  if (!items.length) return;
  const carousel = document.querySelector(selector);
  const track = carousel?.querySelector('[data-carousel-track]');
  if (!carousel || !track) return;
  track.innerHTML = items.map(renderer).join('');
  window.initChurchCarousel?.(carousel);
}

function renderWordSlide(item) {
  return '<article class="word-slide carousel-slide"><img src="' + escapeAttribute(item.image_url) + '" alt="' + escapeAttribute(item.title) + '" loading="lazy"><div><span>' + escapeHtml(item.subtitle) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.description) + '</p></div></article>';
}

function renderPastorSlide(item) {
  const links = safeLinks(item.contact_links).map(function (link) {
    return '<a href="' + escapeAttribute(link.url) + '" target="_blank" rel="noopener">' + escapeHtml(link.label) + '</a>';
  }).join('');
  return '<article class="leader-card carousel-slide"><div class="leader-photo"><img src="' + escapeAttribute(item.image_url) + '" alt="' + escapeAttribute(item.title + ', ' + item.subtitle) + '" loading="lazy"></div><div class="leader-copy"><span>' + escapeHtml(item.subtitle) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.description || item.body) + '</p>' + (links ? '<div class="pastor-links">' + links + '</div>' : '') + '</div></article>';
}

function renderCommunities(items) {
  const grid = document.querySelector('[data-community-grid]');
  if (!grid || !items.length) return;
  grid.innerHTML = items.map(function (item, index) {
    return '<article class="ministry-card"><img class="community-photo" src="' + escapeAttribute(item.image_url) + '" alt="' + escapeAttribute(item.title) + '" loading="lazy"><span>' + String(index + 1).padStart(2, '0') + '</span><div class="icon">✦</div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.description) + '</p>' + (item.button_text ? '<a href="' + escapeAttribute(item.button_url || '#contact') + '">' + escapeHtml(item.button_text) + ' →</a>' : '') + '</article>';
  }).join('');
}

function renderVisitSlide(item) {
  return '<article class="visit-slide carousel-slide"><img src="' + escapeAttribute(item.image_url) + '" alt="' + escapeAttribute(item.title) + '" loading="lazy"><div><span>' + escapeHtml(item.subtitle) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.description) + '</p>' + (item.button_text ? '<a href="' + escapeAttribute(item.button_url || '#contact') + '">' + escapeHtml(item.button_text) + '</a>' : '') + '</div></article>';
}

function safeLinks(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(x => x && /^https?:\/\//.test(x.url || '')) : [];
  } catch {
    return String(value).split('\n').map(function (line) {
      const parts = line.split('|');
      return {label:(parts[0] || 'Contact').trim(),url:(parts[1] || '').trim()};
    }).filter(x => /^https?:\/\//.test(x.url));
  }
}

function splitHeading(value) {
  const parts = String(value).split(/(?<=[.!?])\s+/, 2);
  return escapeHtml(parts[0]) + (parts[1] ? '<br><em>' + escapeHtml(parts[1]) + '</em>' : '');
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
