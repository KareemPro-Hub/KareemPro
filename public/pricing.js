import { mountPackageFinder } from './package-finder.js';

const tabs = [...document.querySelectorAll('[data-price-tab]')];
document.querySelector('.nav-links a[href="#pricing"]')?.addEventListener('click', () => {
  if (window.innerWidth <= 900) document.querySelector('.nav-links')?.style.removeProperty('display');
});
function selectTab(button) {
  tabs.forEach(tab => { tab.setAttribute('aria-selected', String(tab === button)); tab.tabIndex = tab === button ? 0 : -1; });
  document.querySelectorAll('[data-price-panel]').forEach(panel => { panel.hidden = panel.id !== button.getAttribute('aria-controls'); });
}
tabs.forEach((button, index) => {
  button.addEventListener('click', () => selectTab(button));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowLeft') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowRight') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next != null) { event.preventDefault(); tabs[next].focus(); selectTab(tabs[next]); }
  });
});

// Reuse the same guide and catalog for the approved floating shortcut.
const finderSource = document.getElementById('package-finder-catalog');
if (finderSource && !document.querySelector('.package-finder-launcher')) {
  const shortcut = document.createElement('button');
  shortcut.type = 'button';
  shortcut.className = 'package-finder-launcher';
  shortcut.dataset.packageFinder = document.querySelector('[data-package-finder]')?.dataset.packageFinder || '';
  shortcut.setAttribute('aria-haspopup', 'dialog');
  shortcut.innerHTML = '<svg class="ui-icon" width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><use href="/icons/ui.svg#interrogation"></use></svg><span>ساعدني أختار</span>';
  document.body.append(shortcut);
}
mountPackageFinder();
