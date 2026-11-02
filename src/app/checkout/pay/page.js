import { redirect } from 'next/navigation';
import { loadPaymentPage } from '@/lib/xpay-payment-page';
import PaymentSummary from './PaymentSummary';
import PaymentForm from './PaymentForm';
import '../checkout.css';
import './payment.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إتمام الدفع — Kareem Pro', robots: { index: false, follow: false }, referrer: 'same-origin' };
export default async function FinalPaymentPage({ searchParams }) {
  const { session_id: id } = await searchParams;
  let payment;
  try { payment = await loadPaymentPage(id); } catch { /* No secret or provider error is exposed. */ }
  if (payment?.redirect) redirect(payment.redirect);
  if (!payment) return <main className="checkout-page"><section className="checkout-container checkout-empty"><h1>تعذر فتح طلب الدفع</h1><p>أعد فتح رابط الدفعة من لوحة تحكمك أو صفحة الباقة.</p><a href="/">العودة للموقع</a></section></main>;
  const { display, ...form } = payment;
  return <main className="checkout-page payment-final" dir="rtl"><div className="checkout-container payment-final-card">
    <PaymentSummary display={display} />
    <PaymentForm {...form} amountEgpMinor={display.amountEgpMinor} />
  </div></main>;
}
