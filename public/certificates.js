(function () {
  'use strict';
  var menu = document.getElementById('main-nav-links');
  var burger = document.querySelector('.nav-burger');
  function closeMenu() {
    if (!menu || !burger) return;
    menu.classList.remove('nav-is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  if (menu && burger) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('nav-is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('nav')) closeMenu(); });
    window.matchMedia('(min-width:901px)').addEventListener('change', closeMenu);
  }
  var cards = document.querySelectorAll('[data-certificate]');
  if (!cards.length) return;
  var dialog = document.createElement('dialog');
  dialog.className = 'certificate-dialog';
  dialog.setAttribute('aria-labelledby', 'certificate-dialog-title');
  dialog.innerHTML = '<header><h2 id="certificate-dialog-title"></h2><button type="button" autofocus>إغلاق</button></header><img alt="" />';
  document.body.appendChild(dialog);
  var opener;
  dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (e) {
    var r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('certificate-open');
    if (opener) opener.focus({ preventScroll: true });
  });
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      opener = card;
      var image = dialog.querySelector('img');
      image.src = card.dataset.certificate;
      image.alt = card.querySelector('img').alt;
      dialog.querySelector('h2').textContent = card.querySelector('.certificate-title').textContent;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.documentElement.classList.add('certificate-open');
    });
  });
})();
