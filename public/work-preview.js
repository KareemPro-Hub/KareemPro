// Portfolio images open locally; no project links or embedded external pages.
(function () {
  'use strict';
  var cards = document.querySelectorAll('[data-work-preview]');
  if (!cards.length) return;
  var dialog = document.createElement('dialog');
  dialog.className = 'work-preview';
  dialog.setAttribute('aria-labelledby', 'work-preview-title');
  dialog.setAttribute('aria-describedby', 'work-preview-description');
  dialog.innerHTML = '<div class="work-preview-head"><span>نموذج من أعمالنا</span><button type="button" class="work-preview-close" aria-label="إغلاق عرض النموذج" autofocus>إغلاق ×</button></div><h2 id="work-preview-title"></h2><p id="work-preview-description"></p><img class="work-preview-image" alt="" /><p class="work-preview-note">صور من المشروع</p>';
  document.body.appendChild(dialog);
  var opener;
  var image = dialog.querySelector('img');
  var close = dialog.querySelector('button');
  close.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      close.focus();
    }
  });
  dialog.addEventListener('click', function (event) {
    var box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('work-preview-open');
    if (opener) opener.focus({ preventScroll: true });
  });
  cards.forEach(function (card) {
    card.addEventListener('click', function (event) {
      // The carousel first brings a side card into view.
      if (event.defaultPrevented) return;
      var title = card.querySelector('.gname, .shot-cap b, .site-body b');
      var description = card.querySelector('.gdesc, .shot-cap div > span, .site-body p');
      var shot = card.querySelector('img');
      var src = card.dataset.previewImage || (shot && shot.getAttribute('src'));
      if (!title || !src || !new URL(src, location.href).href.startsWith(location.origin + '/')) return;
      opener = card;
      dialog.querySelector('h2').textContent = title.textContent;
      dialog.querySelector('#work-preview-description').textContent = description ? description.textContent : '';
      image.src = src;
      image.alt = title.textContent;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.documentElement.classList.add('work-preview-open');
    });
  });
})();
