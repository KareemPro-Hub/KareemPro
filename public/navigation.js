(function () {
  'use strict';
  var nav = document.querySelector('nav');
  var initialHash = location.hash;
  var navigated = false;
  var sequence = 0;
  function destination(hash) {
    var section;
    try { section = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return null; }
    if (!section || !section.closest('main')) return null;
    // Align the visible heading rather than the section's decorative top padding.
    return section.querySelector('.sec-head, .certificates-heading') || section;
  }
  async function align(hash) {
    var ticket = ++sequence;
    if (document.fonts) await document.fonts.ready;
    if (ticket !== sequence) return;
    var target = destination(hash);
    if (!target) return;
    var offset = (nav ? nav.offsetHeight : 0) + 20;
    var transform = getComputedStyle(target).transform;
    var revealShift = target.classList.contains('reveal') && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0;
    window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - revealShift - offset), behavior: 'instant' });
    // Lazy content and reveal transitions can settle after navigation.
    setTimeout(function () {
      if (ticket !== sequence) return;
      var matrix = getComputedStyle(target).transform;
      var shift = target.classList.contains('reveal') && matrix !== 'none' ? new DOMMatrixReadOnly(matrix).m42 : 0;
      var delta = target.getBoundingClientRect().top - shift - (nav ? nav.offsetHeight : 0) - 20;
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
    }, 650);
  }
  window.addEventListener('wheel', function () { sequence++; }, { passive: true });
  window.addEventListener('touchstart', function () { sequence++; }, { passive: true });
  document.addEventListener('keydown', function (event) { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) sequence++; });
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var hash = link.getAttribute('href');
    if (!destination(hash)) return;
    event.preventDefault();
    navigated = true;
    if (location.hash !== hash) history.pushState(null, '', hash);
    align(hash);
  });
  window.addEventListener('hashchange', function () { align(location.hash); });
  window.addEventListener('load', function () {
    if (!navigated && initialHash && location.hash === initialHash) align(initialHash);
  }, { once: true });
})();
