import RiyalIcon from "@/app/components/RiyalIcon";
import { checkoutTagline } from '@/lib/checkout-copy';
import { selectedPayment, paymentsReady, paymentSnapshot } from '@/lib/xpay-server';
import { redirect } from 'next/navigation';
import { signQuote } from '@/lib/xpay.mjs';
export const dynamic = 'force-dynamic';
import { GET as getRate } from '@/app/api/exchange-rate/route';
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
  const [name] = pkg.name.split('|');
  const tagline = checkoutTagline(selected);
  const amount = pkg.price.toLocaleString('en-US');
  const egyptian = pkg.currency === 'EGP';
  const currencyUnit = egyptian ? <span>ج.م</span> : <RiyalIcon size="0.8em" />;
  const equivalent = rate ? ((snapshot?.amount_egp_minor ?? Math.round(pkg.price * rate.rate * 100)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
  return (
    <main className="checkout-page" dir="rtl">
      <header className="checkout-header checkout-container">
        <a href="/" className="checkout-brand" aria-label="Kareem Pro — الرئيسية"><img src="/logo-transparent.png" alt="" width="34" height="38" />KAREEM <span>PRO</span></a>
        <a className="checkout-back" href="/#pricing">العودة للأسعار<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a>
      </header>
      <div className="checkout-container">
        <div className="checkout-intro"><h1>إتمام الدفع</h1><p>راجع طلبك، وأكمل خطوتك التالية.</p></div>
        <div className="checkout-order-card">
          <section className="checkout-summary" aria-labelledby="summary-title">
            <p className="checkout-section-label" id="summary-title">ملخص الطلب</p>
            <span className="checkout-service">{service.name}</span>
            <h2 className="checkout-plan-name">{name}</h2>
            <p className="checkout-tagline">{tagline}</p>
            <div className="checkout-sar-total"><span>قيمة الطلب</span><strong><bdi>{amount}</bdi> {currencyUnit}</strong></div>
          </section>
          <section className="checkout-payment" aria-labelledby="payment-title">
            <div className="checkout-payment-heading"><span className="checkout-lock"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></span><h2 id="payment-title">الدفع</h2></div>
            <p className="checkout-amount-label">المبلغ المطلوب</p>
            <div className="checkout-amount"><strong dir="ltr">{amount}</strong>{currencyUnit}</div>
            {equivalent ? (!egyptian && <details className="checkout-currency-details"><summary>عرض المبلغ بالجنيه المصري<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><p className="checkout-equivalent"><span>بما يعادل</span><bdi>{equivalent}</bdi><span>ج.م</span></p></details>) : <p className="checkout-error" role="alert">تعذر تحديث سعر التحويل حاليًا. أعد تحميل الصفحة لاحقًا.</p>}
            <p className="checkout-conversion-note">السداد عبر Xpay بالجنيه المصري.</p>
            <form action="/api/xpay/checkout" method="post">
              <input type="hidden" name="quote" value={quote} />
              <button className="checkout-pay-button" type="submit" disabled={!ready} aria-describedby="payment-status">المتابعة للدفع<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg></button>
            </form>
            <p className={`checkout-payment-status${ready ? '' : ' unavailable'}`} id="payment-status" role="status">{ready ? 'ستكمل السداد على صفحة Xpay الآمنة.' : 'الدفع الإلكتروني غير متاح حاليًا. يرجى المحاولة لاحقًا.'}</p>
            <p className="checkout-payment-note">المبلغ بالجنيه ثابت لهذا العرض لمدة 15 دقيقة.<br />لا نضيف رسومًا على المبلغ الموضح.</p>
            <p className="checkout-terms">راجع <a href="/terms.html">الشروط والأحكام</a> و<a href="/refund-policy.html">سياسة الاسترداد</a> قبل السداد.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
