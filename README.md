# Bread of Life Divine Covenant Ministry

A complete, responsive PHP church website with sermon/YouTube embedding, service times, ministries, events, giving, visitor planning, prayer/contact form, mobile navigation and SEO basics.

## Run locally

```bash
php -S localhost:8080
```

Open `http://localhost:8080`.

If PHP is unavailable, build the static demo with `node scripts/export-static.mjs` and serve the `dist` folder.

## Replace content

- Church details, service times and YouTube links: `config.php`
- Page copy and events: `index.php`
- Images: search for `images.unsplash.com` in `index.php`
- Colours and layout: `assets/css/style.css`

The contact and giving controls are presentation-ready placeholders. Connect a mail service and your church's secure giving provider before public launch.
