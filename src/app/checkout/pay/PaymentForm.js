'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

export default function PaymentForm({ publicKey, clientSecret, sessionId, amountEgpMinor, back, result }) {
  const container = useRef(null);
  const checkout = useRef(null);
  const paymentComplete = useRef(false);
  const submitting = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!scriptReady) return;
    let cancelled = false;
    let element;
    const matches = session => session.id === sessionId && session.currency === 'EGP' && Number(session.amountTotal) === amountEgpMinor;
    function update(session) {
      if (cancelled) return;
      if (!matches(session)) {
        checkout.current = null;
        setReady(false);
        setError('تغيّرت بيانات الدفع. ارجع لملخص الطلب قبل المحاولة مجددًا.');
        return;
      }
      if (session.status.type === 'expired') { window.location.replace(back); return; }
      if (session.status.type === 'complete') { window.location.replace(result); return; }
      setReady(paymentComplete.current && session.canConfirm);
    }
    async function start() {
      try {
        const instance = await window.XPay(publicKey).initCheckout({ clientSecret, locale: 'ar', appearance: { colorMode: 'light', borderStyle: 'rounded', colors: { primary: '#a83e13', background: '#ffffff', foreground: '#17213e' } } });
        if (cancelled) return;
        if (!matches(instance)) throw Error('Invalid payment snapshot');
        checkout.current = instance;
        update(instance);
        if (instance.status.type !== 'open') return;
        element = instance.getElements().create('payment');
        element.on('change', event => { paymentComplete.current = event.complete; update(event.session); });
        element.on('loaderror', () => { if (!cancelled) { setReady(false); setError('تعذر تحميل وسائل الدفع. أعد تحميل الصفحة للمحاولة مجددًا.'); } });
        instance.on('change', update);
        instance.on('error', () => { if (!cancelled) { setReady(false); setError('تعذر تجهيز السداد. ارجع لملخص الطلب وأعد المحاولة.'); } });
        element.mount(container.current);
      } catch {
        if (!cancelled) { setReady(false); setError('تعذر تحميل وسائل الدفع. أعد تحميل الصفحة للمحاولة مجددًا.'); }
      }
    }
    start();
    return () => { cancelled = true; checkout.current = null; paymentComplete.current = false; element?.destroy(); };
  }, [scriptReady, publicKey, clientSecret, sessionId, amountEgpMinor, back, result]);

  async function pay(event) {
    event.preventDefault();
    if (!ready || !checkout.current?.canConfirm || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await checkout.current.confirm({ customerDetails: { name: form.get('name').trim(), email: form.get('email').trim(), phone: form.get('phone').trim() }, redirect: 'always' });
      if (response.type === 'success') { window.location.assign(result); return; }
      setError('لم تكتمل عملية الدفع. راجع بياناتك وحاول مجددًا، أو اختر وسيلة دفع أخرى.');
    } catch {
      setError('تعذر الاتصال. تحقّق من حالة السداد قبل المحاولة مجددًا.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return <section className="payment-final-form" aria-labelledby="payment-form-title">
    <h2 id="payment-form-title">إتمام الدفع</h2>
    <Script src="https://checkout.xpay.app/v1/sdk.js" strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setError('تعذر تحميل وسائل الدفع. أعد تحميل الصفحة للمحاولة مجددًا.')} />
    <form onSubmit={pay}>
      <label htmlFor="payer-name">الاسم الكامل</label><input id="payer-name" name="name" autoComplete="name" required maxLength={150} />
      <label htmlFor="payer-email">البريد الإلكتروني</label><input id="payer-email" name="email" type="email" dir="ltr" autoComplete="email" required maxLength={254} />
      <label htmlFor="payer-phone">رقم الجوال مع رمز الدولة</label><input id="payer-phone" name="phone" type="tel" dir="ltr" autoComplete="tel" placeholder="+966 5xxxxxxxx" required maxLength={30} />
      <div ref={container} className="payment-element" aria-label="وسائل الدفع" />
      {!scriptReady && !error && <p role="status">جاري تجهيز وسائل الدفع…</p>}
      <p className="payment-final-error" role="alert">{error}</p>
      <button className="checkout-pay-button" type="submit" disabled={!ready || busy}>{busy ? 'جاري إتمام الدفع…' : 'دفع آمن'}</button>
      <p className="payment-final-links"><a href={back}>العودة لملخص الطلب</a><a href={result}>التحقق من حالة السداد</a></p>
    </form>
  </section>;
}
