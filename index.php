<?php $data = require __DIR__ . '/config.php'; $church = $data['church']; ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Welcome to Bread of Life Divine Covenant Ministry—a Christ-centred family growing in faith, love and purpose.">
  <title><?= htmlspecialchars($church['full_name']) ?></title>
  <link rel="icon" href="assets/images/bread-of-life-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/theme.css">
</head>
<body>
  <div class="announcement">Join us this Sunday · 8:00 AM & 10:30 AM <a href="#visit">Plan your visit →</a></div>
  <header class="site-header" id="top">
    <a class="brand" href="#top" aria-label="Bread of Life home"><img class="brand-logo" src="assets/images/bread-of-life-logo.png" alt="Bread of Life Divine Covenant Ministry logo"><span><b>Bread of Life</b><small>Divine Covenant Ministry</small></span></a>
    <button class="nav-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>
    <nav aria-label="Main navigation">
      <a href="#about">About</a><a href="#sermons">Sermons</a><a href="#ministries">Ministries</a><a href="#events">Events</a><a href="#contact">Contact</a>
      <a class="nav-give" href="#give">Give</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="hero-shade"></div>
      <div class="hero-content reveal">
        <p class="eyebrow">Welcome home</p>
        <h1>There is a place<br><em>for you here.</em></h1>
        <p><?= htmlspecialchars($church['tagline']) ?></p>
        <div class="hero-actions"><a class="button primary" href="#visit">Plan your visit</a><a class="button ghost" href="#sermons"><span class="play">▶</span> Watch a message</a></div>
      </div>
      <div class="hero-emblem" aria-hidden="true"><img src="assets/images/bread-of-life-logo.png" alt=""><span class="orbit one"></span><span class="orbit two"></span></div>
      <div class="service-pill"><span>Next gathering</span><b>Sunday · 8:00 AM</b></div>
    </section>

    <section class="welcome section" id="about">
      <div class="section-kicker">Who we are</div>
      <div class="welcome-grid">
        <div><h2>Faith for today.<br><em>Hope for tomorrow.</em></h2></div>
        <div><p class="lead">We are a growing family of believers committed to knowing Jesus, living His Word and sharing His love with our community.</p><p>Whatever your story or season, you are welcome here. Come as you are and discover a place to worship, grow, serve and belong.</p><a class="text-link" href="#beliefs">Discover our story →</a></div>
      </div>
      <div class="photo-strip">
        <figure class="photo-large"><img src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=85" alt="Church community worshipping"><figcaption>Worship together</figcaption></figure>
        <figure><img src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=900&q=85" alt="Open Bible during worship"><figcaption>Grow in the Word</figcaption></figure>
      </div>
    </section>

    <section class="scripture-band">
      <button class="verse-arrow prev" aria-label="Previous scripture">←</button><div class="verse-stage"><div class="verse active"><p>“I am the bread of life. Whoever comes to me will never go hungry.”</p><span>John 6:35</span></div><div class="verse"><p>“Where the Spirit of the Lord is, there is freedom.”</p><span>2 Corinthians 3:17</span></div><div class="verse"><p>“We walk by faith, not by sight.”</p><span>2 Corinthians 5:7</span></div></div><button class="verse-arrow next" aria-label="Next scripture">→</button>
    </section>

    <section class="impact-strip" aria-label="Church impact"><div><b data-count="250">0</b><span>Families reached</span></div><div><b data-count="18">0</b><span>Outreach projects</span></div><div><b data-count="12">0</b><span>Ministry groups</span></div><div><b data-count="1">0</b><span>Family in Christ</span></div></section>

    <section class="sermons section" id="sermons">
      <div class="section-head"><div><div class="section-kicker">Watch & listen</div><h2>Latest message</h2></div><a class="text-link" href="<?= htmlspecialchars($data['youtube']['channel_url']) ?>" target="_blank" rel="noopener">View all messages →</a></div>
      <div class="video-grid">
        <div class="video-wrap"><iframe src="<?= htmlspecialchars($data['youtube']['featured_embed']) ?>" title="Featured church message" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
        <div class="message-copy"><span class="tag">Featured sermon</span><h3>Living by Faith,<br>Walking in Purpose</h3><p>A practical message about trusting God through every season and becoming who He created you to be.</p><div class="speaker"><span class="avatar">PA</span><span><b>Pastor's Name</b><small>Lead Pastor · Sample content</small></span></div><a class="button dark" href="<?= htmlspecialchars($data['youtube']['channel_url']) ?>" target="_blank" rel="noopener">Visit our YouTube</a></div>
      </div>
    </section>

    <section class="ministries section" id="ministries">
      <div class="centered"><div class="section-kicker">Find your community</div><h2>There’s a place for everyone</h2><p>Life is better together. Find connection, purpose and spiritual growth in one of our ministry families.</p></div>
      <div class="card-grid">
        <article class="ministry-card"><span>01</span><div class="icon">✦</div><h3>Children</h3><p>A safe, joyful space where children discover God's love.</p><a href="#contact">Learn more →</a></article>
        <article class="ministry-card featured"><span>02</span><div class="icon">↗</div><h3>Youth</h3><p>Helping a generation grow bold in faith and purpose.</p><a href="#contact">Learn more →</a></article>
        <article class="ministry-card"><span>03</span><div class="icon">♡</div><h3>Women & Men</h3><p>Meaningful fellowship, discipleship and support for every season.</p><a href="#contact">Learn more →</a></article>
        <article class="ministry-card"><span>04</span><div class="icon">◎</div><h3>Outreach</h3><p>Serving our neighbours and sharing Christ beyond our walls.</p><a href="#contact">Learn more →</a></article>
      </div>
    </section>

    <section class="events section" id="events">
      <div class="section-head"><div><div class="section-kicker light">What’s happening</div><h2>Upcoming events</h2></div><a class="text-link light" href="#contact">View calendar →</a></div>
      <div class="events-list">
        <article><div class="date"><b>14</b><span>SEP</span></div><div><span class="tag gold">Worship</span><h3>Covenant Worship Night</h3><p>5:00 PM · Main Auditorium</p></div><a href="#contact" aria-label="Details for Covenant Worship Night">↗</a></article>
        <article><div class="date"><b>21</b><span>SEP</span></div><div><span class="tag gold">Community</span><h3>Family & Friends Sunday</h3><p>10:30 AM · Church Grounds</p></div><a href="#contact" aria-label="Details for Family and Friends Sunday">↗</a></article>
        <article><div class="date"><b>04</b><span>OCT</span></div><div><span class="tag gold">Outreach</span><h3>Community Care Day</h3><p>9:00 AM · Meeting at Church</p></div><a href="#contact" aria-label="Details for Community Care Day">↗</a></article>
      </div>
    </section>

    <section class="visit section" id="visit">
      <div class="visit-photo"><img src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=85" alt="Welcoming church community"><span>Come as you are</span></div>
      <div class="visit-copy"><div class="section-kicker">Your first Sunday</div><h2>We can’t wait<br>to meet you.</h2><p>Visiting a new church can feel like a big step. We’ll make it simple—from directions and parking to helping your children settle in.</p>
        <div class="service-list"><?php foreach ($data['services'] as $service): ?><div><span><?= htmlspecialchars($service['day']) ?><small><?= htmlspecialchars($service['name']) ?></small></span><b><?= htmlspecialchars($service['time']) ?></b></div><?php endforeach; ?></div>
        <a class="button primary" href="#contact">Let us know you’re coming</a>
      </div>
    </section>

    <section class="give section" id="give"><div><div class="section-kicker light">Generosity</div><h2>We give because<br><em>God first gave.</em></h2></div><div><p>Your generosity helps us share the Gospel, care for families and serve our community. Add your secure giving provider link here when ready.</p><a class="button cream" href="#contact">Give securely</a></div></section>

    <section class="contact section" id="contact">
      <div><div class="section-kicker">Connect with us</div><h2>How can we<br>stand with you?</h2><p>Send a prayer request, ask a question or tell us you’re planning a visit. Our team would love to hear from you.</p><div class="contact-details"><p><b>Visit</b><span><?= htmlspecialchars($church['address']) ?></span></p><p><b>Contact</b><span><?= htmlspecialchars($church['phone']) ?><br><?= htmlspecialchars($church['email']) ?></span></p></div></div>
      <form id="contact-form"><label>Your name<input name="name" required placeholder="Full name"></label><label>Email or phone<input name="contact" required placeholder="How can we reach you?"></label><label>I would like to…<select name="reason"><option>Plan a visit</option><option>Submit a prayer request</option><option>Join a ministry</option><option>Ask a question</option></select></label><label>Message<textarea name="message" rows="4" placeholder="Write your message here"></textarea></label><button class="button dark" type="submit">Send message</button><p class="form-note" aria-live="polite"></p></form>
    </section>
  </main>

  <a class="prayer-float" href="#contact"><span>♡</span> Prayer request</a><button class="to-top" aria-label="Back to top">↑</button>
  <footer><div class="footer-brand"><img class="brand-logo" src="assets/images/bread-of-life-logo.png" alt="Bread of Life logo"><span><b>Bread of Life</b><small>Divine Covenant Ministry</small></span></div><p>Jesus at the centre. People at heart.</p><div class="footer-links"><a href="#about">About</a><a href="#sermons">Sermons</a><a href="#ministries">Ministries</a><a href="#events">Events</a><a href="#give">Give</a></div><div class="copyright">© <?= date('Y') ?> Bread of Life Divine Covenant Ministry. All rights reserved. <span>Sample website—replace placeholder details before launch.</span></div></footer>
  <script src="assets/js/main.js"></script>
</body></html>
