import catalog from '../../../public/pricing-catalog.json';
import { checkoutPackage } from '@/lib/checkout';
import { GET as getRate } from '@/app/api/exchange-rate/route';
import { egpText, rateDate } from '../../../public/currency.js';
import './checkout.css';

export const metadata = { title: 'الدفع — Kareem Pro', robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }) {
  const selected = checkoutPackage(catalog, await searchParams);
  if (!selected) return <main className="checkout-page"><div className="checkout-container checkout-empty"><h1>الباقة غير موجودة</h1><p>اختر باقة من صفحة الأسعار للاطلاع على ملخصها.</p><a href="/#pricing">العودة للأسعار</a></div></main>;
  const { service, pkg } = selected;
  const response = await getRate();
  const rate = response.ok ? await response.json() : null;
  const [name, tagline] = pkg.name.split('|');
  const amount = pkg.price.toLocaleString('en-US');
  const equivalent = rate ? egpText(pkg.price, rate.rate) : null;
  return (
    <main className="checkout-page">
      <header className="checkout-header checkout-container"><a href="/" className="checkout-brand"><img src="/logo-transparent.png" alt="" width="32" height="32" />KAREEM <span>PRO</span></a><a href="/#pricing">العودة للأسعار</a></header>
      <div className="checkout-container checkout-grid">
        <section className="checkout-panel checkout-payment" aria-labelledby="payment-title">
          <h1 id="payment-title"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>الدفع</h1>
          <div className="checkout-payment-box">
            <h2>إتمام طلب الباقة</h2>
            <p>راجع الباقة وقيمتها بالريال السعودي وما يعادلها بالجنيه المصري.</p>
            <button className="checkout-pay-button" type="button" disabled aria-describedby="payment-status">ادفع الآن <span dir="ltr">{amount}</span> ريال</button>
            {equivalent ? <p className="checkout-equivalent">المبلغ المقابل بالجنيه المصري: <strong dir="ltr">{equivalent} ج.م</strong></p> : <p className="checkout-error">تعذر تحديث سعر التحويل حاليًا. أعد تحميل الصفحة لاحقًا.</p>}
            <p className="checkout-payment-status" id="payment-status" role="status">الدفع الإلكتروني غير متاح حاليًا. سنفعّله قريبًا.</p>
            <p className="checkout-payment-note">المبلغ بالجنيه محسوب بسعر التحويل الموضح. يُؤكَّد المبلغ النهائي قبل أي عملية دفع.</p>
          </div>
          <p className="checkout-terms">اطلع على <a href="/terms.html">الشروط والأحكام</a> و<a href="/refund-policy.html">سياسة الاسترجاع</a> قبل السداد.</p>
        </section>
        <aside className="checkout-panel checkout-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">ملخص الطلب</h2>
          <span className="checkout-service">{service.name}</span>
          <h3>{name}</h3><p>{tagline.replaceAll('**', '')}</p>
          <dl><div><dt>سعر الباقة</dt><dd><span dir="ltr">{amount}</span> ريال سعودي</dd></div><div className="checkout-total"><dt>الإجمالي</dt><dd><span dir="ltr">{amount}</span> ريال سعودي</dd></div></dl>
          {equivalent && <div className="checkout-egp-box"><span>ما يعادله بالجنيه المصري</span><strong dir="ltr">{equivalent} ج.م</strong><small>تحديث {rateDate(rate.updatedAt)} · <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">مصدر التحويل</a></small></div>}
          <h4>مميزات الباقة</h4><ul>{pkg.features.split('\n').map((feature, i) => <li key={i}>{feature.replaceAll('**', '')}</li>)}</ul>
        </aside>
      </div>
    </main>
  );
}
