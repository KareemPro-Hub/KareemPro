export default function PaymentSummary({ display }) {
  const amount = display.amountSar.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const egyptian = (display.amountEgpMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <section className="payment-final-summary" aria-label="ملخص الدفعة">
    <p className="payment-final-brand" dir="ltr">Kareem Pro</p>
    <h1>{display.heading}</h1>
    <p className="payment-final-stage">{display.stage}</p>
    {!display.egyptian && <p className="payment-final-sar"><bdi>{amount}</bdi><span>ريال سعودي</span></p>}
    <p className="payment-final-egp">المبلغ بالجنيه المصري: <bdi>{egyptian}</bdi> جنيه</p>
  </section>;
}
