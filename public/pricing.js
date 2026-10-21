import { getRate, egpText } from './currency.js';

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

// Existing service cards keep their Saudi price and receive the same equivalent.
document.querySelectorAll('.pk-price').forEach(price => {
  if (price.nextElementSibling?.hasAttribute('data-sar')) return;
  const amount = Number(price.querySelector('.pk-val')?.textContent.replaceAll(',', ''));
  if (!Number.isFinite(amount)) return;
  const equivalent = document.createElement('div');
  equivalent.className = 'currency-equivalent';
  equivalent.dataset.sar = String(amount);
  equivalent.textContent = 'جارٍ حساب مقابل الجنيه…';
  price.after(equivalent);
});
const equivalents = [...document.querySelectorAll('[data-sar]')];
if (equivalents.length) getRate().then(rate => {
  equivalents.forEach(element => {
    const value = Number(element.dataset.sar);
    if (!Number.isFinite(value) || value < 0) return;
    const amount = document.createElement('b');
    amount.dir = 'ltr'; amount.textContent = egpText(value, rate.rate) + ' ج.م';
    element.replaceChildren('يعادل ', amount);
  });
}).catch(() => equivalents.forEach(element => { element.textContent = 'تعذر تحديث مقابل الجنيه حاليًا؛ تواصل معنا لتأكيد المبلغ.'; }));
