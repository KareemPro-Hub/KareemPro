import { selectedPayment, paymentsReady, paymentSnapshot } from '@/lib/xpay-server';
import { redirect } from 'next/navigation';
import { signQuote } from '@/lib/xpay.mjs';
export const dynamic = 'force-dynamic';
import { GET as getRate } from '@/app/api/exchange-rate/route';
import { rateDate } from '../../../public/currency.js';
import './checkout.css';

export const metadata = { title: 'الدفع — Kareem Pro', robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }) {
  const selected = await selectedPayment(await searchParams);
  if (!selected) return <main className="checkout-page"><div className="checkout-container checkout-empty"><h1>الباقة غير موجودة</h1><p>اختر باقة من صفحة الأسعار للاطلاع على ملخصها.</p><a href="/#pricing">العودة للأسعار</a></div></main>;
  const { service, pkg } = selected;
  const response = await getRate();
  let rate = response.ok ? await response.json() : null;
  const ready = paymentsReady() && !!rate;
  const snapshot = ready ? await paymentSnapshot(selected, rate) : null;
  if (snapshot?.paidSession) redirect('/checkout/result?session_id=' + encodeURIComponent(snapshot.paidSession));
  if (snapshot) rate = { ...rate, rate: snapshot.exchange_rate, updatedAt: Date.parse(snapshot.rate_updated_at) };
  const quote = ready ? signQuote(snapshot, process.env.XPAY_QUOTE_SECRET) : '';
  const [name, tagline] = pkg.name.split('|');
  const amount = pkg.price.toLocaleString('en-US');
  const equivalent = rate ? ((snapshot?.amount_egp_minor ?? Math.round(pkg.price * rate.rate * 100)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
  return (
    <main className="checkout-page">
      <header className="checkout-header checkout-container"><a href="/" className="checkout-brand"><img src="/logo-transparent.png" alt="" width="32" height="32" />KAREEM <span>PRO</span></a><a href="/#pricing">العودة للأسعار</a></header>
      <div className="checkout-container checkout-grid">
        <section className="checkout-panel checkout-payment" aria-labelledby="payment-title">
          <h1 id="payment-title"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>الدفع</h1>
          <div className="checkout-payment-box">
            <h2>إتمام طلب الباقة</h2>
            <p>راجع الباقة وقيمتها بالريال السعودي وما يعادلها بالجنيه المصري.</p>
            <form action="/api/xpay/checkout" method="post"><input type="hidden" name="quote" value={quote} /><button className="checkout-pay-button" type="submit" disabled={!ready} aria-describedby="payment-status">ادفع الآن <span dir="ltr">{amount}</span> ريال</button></form>
            {equivalent ? <p className="checkout-equivalent">سيتم سداد مبلغ: <strong dir="ltr">{equivalent} ج.م</strong></p> : <p className="checkout-error">تعذر تحديث سعر التحويل حاليًا. أعد تحميل الصفحة لاحقًا.</p>}
            <p className="checkout-payment-status" id="payment-status" role="status">{ready ? 'ستنتقل إلى صفحة Xpay الآمنة لإتمام السداد.' : 'الدفع الإلكتروني غير متاح حاليًا. يرجى المحاولة لاحقًا.'}</p>
            <p className="checkout-payment-note">المبلغ الموضح بالجنيه هو مبلغ السداد عبر Xpay، وثابت لهذا العرض لمدة 15 دقيقة. لا نضيف رسومًا على المبلغ الموضح.</p>
          </div>
          <p className="checkout-terms">اطلع على <a href="/terms.html">الشروط والأحكام</a> و<a href="/refund-policy.html">سياسة الاسترداد</a> قبل السداد.</p>
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
