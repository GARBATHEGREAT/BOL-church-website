(function () {
  const paths = {
    youtube:'<path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"/>',
    instagram:'<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>',
    facebook:'<path d="M14 22v-9h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7h1.9V3.8c-.3 0-1.5-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.6V10h-3v3h3v9H14Z"/>',
    tiktok:'<path d="M15.5 3c.4 2.1 1.6 3.4 3.5 3.9v3.2a8 8 0 0 1-3.5-1v6.2a6.2 6.2 0 1 1-5.4-6.1v3.2a3 3 0 1 0 2.2 2.9V3h3.2Z"/>',
    x:'<path d="M4 3h4.2l4.5 6.1L18 3h2l-6.4 7.5L21 21h-4.2l-5-6.8L6 21H4l6.9-8.2L4 3Zm3.2 2L18 19h.8L8 5h-.8Z"/>',
    whatsapp:'<path d="M12 2a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l5.3-1.3A9.5 9.5 0 1 0 12 2Zm0 2a7.5 7.5 0 0 1 0 15c-1.3 0-2.6-.3-3.7-1l-.7-.4-2.2.6.6-2.1-.4-.7A7.5 7.5 0 0 1 12 4Zm-3.2 3.8c-.2 0-.5.1-.7.4-.3.3-1 1-.9 2.3 0 1.4 1 2.7 1.2 2.9.2.2 2 3.1 5 4.2 2.5.9 3 .7 3.6.6.6-.1 1.8-.8 2.1-1.5.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.7-.4l-2.1-1c-.3-.2-.6-.1-.8.2l-1 1.2c-.2.2-.4.2-.7.1-1.1-.4-2-.9-2.8-1.9-.2-.3 0-.5.2-.7l.7-.8c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.7l-1-2.4c-.3-.6-.6-.5-.8-.5h-.8Z"/>'
  };
  document.querySelectorAll('[data-social]').forEach(function (link) {
    const network = link.dataset.social;
    if (!paths[network]) return;
    const svg = '<svg class="social-icon" aria-hidden="true" viewBox="0 0 24 24">' + paths[network] + '</svg>';
    const badge = link.querySelector('b');
    if (badge) badge.innerHTML = svg;
    else if (link.closest('.social-rail')) link.innerHTML = svg;
    else link.insertAdjacentHTML('afterbegin', svg);
  });
})();
