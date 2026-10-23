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
  link.innerHTML = '<svg aria-hidden="true" class="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#comment"></use></svg>';
  document.body.appendChild(link);
})();
