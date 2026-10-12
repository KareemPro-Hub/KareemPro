'use client';

import { useEffect, useState } from 'react';
import { getRate, egpText, rateDate } from '../../../public/currency.js';
import '../../../public/pricing.css';

export default function CurrencyEquivalent({ amount, tone = 'light' }) {
  const [rate, setRate] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    getRate().then(value => { if (active) setRate(value); })
      .catch(() => { if (active) setUnavailable(true); });
    return () => { active = false; };
  }, []);
  if (!Number.isFinite(Number(amount)) || Number(amount) < 0) return null;
  return (
    <span className="currency-equivalent" data-tone={tone} aria-live="polite">
      {rate ? <>
        <span>يعادل <b dir="ltr">{egpText(Number(amount), rate.rate)} ج.م</b></span>
        <small>تحديث {rateDate(rate.updatedAt)} · <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">مصدر التحويل</a></small>
      </> : <span>{unavailable ? 'تعذر تحديث مقابل الجنيه حاليًا' : 'جارٍ حساب مقابل الجنيه…'}</span>}
    </span>
  );
}
