(function () {
  'use strict';
  function year() {
    var now = new Date();
    document.querySelectorAll('[data-current-year]').forEach(function (el) { var value = String(now.getFullYear()); if (el.textContent !== value) el.textContent = value; });
    document.querySelectorAll('[data-current-month]').forEach(function (el) { var value = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', month: 'long', year: 'numeric' }).format(now); if (el.textContent !== value) el.textContent = value; });
  }
  year();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) year(); });
  setInterval(year, 60000);
  if (document.querySelector('.whatsapp-launcher')) return;
  var link = document.querySelector('a.float[href*="wa.me/"]') || document.createElement('a');
  if (!link.hasAttribute('href')) link.href = 'https://wa.me/966507069605';
  link.classList.add('whatsapp-launcher');
  link.setAttribute('aria-label', 'تواصل فوري عبر واتساب');
  link.title = 'تواصل فوري عبر واتساب';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.5-4-4.6-4.2-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6 0l.9-1c.2-.2.3-.2.5-.1l2 .9c.2.1.4.2.4.3 0 .2 0 .8-.2 1.3Z"/></svg>';
  document.body.appendChild(link);
})();
