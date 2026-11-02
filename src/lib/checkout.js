export function checkoutPackage(catalog, params) {
  const serviceId = params?.service;
  const tier = params?.tier;
  if (typeof serviceId !== 'string' || typeof tier !== 'string' || !(/^[0-3]$/.test(tier) || ['basic', 'featured', 'professional'].includes(tier))) return null;
  // Fixed-price, unlisted live payment check; never accept an amount from the URL.
  const egyptianCheck = serviceId === 'payment-check-egp';
  const service = serviceId === 'payment-check' || egyptianCheck ? {
    id: serviceId,
    name: 'تجربة دفع حقيقية',
    packages: [{
      name: 'تجربة الدفع|مبلغ صغير لتجربة السداد ببطاقتك.',
      price: egyptianCheck ? 100 : 10,
      ...(egyptianCheck ? { currency: 'EGP' } : {}),
      features: 'سداد حقيقي يُخصم من بطاقتك عند تأكيد الدفع.\nيُحتسب المبلغ بالجنيه المصري وفق القيمة الموضحة قبل السداد.\nهذا الطلب مخصص لتجربة الدفع ولا يتضمن شراء باقة خدمات.',
    }],
  } : catalog.find(s => s.id === serviceId);
  const index = service?.packages.findIndex((pkg, i) => pkg.id
    ? pkg.id === tier || (/^[0-3]$/.test(tier) && pkg.legacyTiers?.includes(Number(tier)))
    : i === Number(tier));
  const pkg = service?.packages[index];
  if (!pkg || !Number.isFinite(pkg.price) || pkg.price <= 0) return null;
  return { service, pkg, tier: index };
}

export function checkoutPriceMatches(pkg, quote) {
  return pkg.currency === 'EGP'
    ? quote.amount_egp_minor === Math.round(pkg.price * 100)
    : quote.amount_sar === pkg.price;
}

// Stable platform URL: never send a signed price quote in a customer link.
export function checkoutPath(quote) {
  const params = quote.stage_id
    ? { stage: quote.stage_id }
    : { service: quote.service_id, tier: quote.tier_key ?? String(quote.tier) };
  return '/checkout?' + new URLSearchParams(params).toString();
}

// Hosted checkout keeps the EGP charge; show the agreed SAR value above it
// in its product heading. Direct EGP products retain their original title.
export function hostedPaymentTitle(order, pkg) {
  if (pkg.currency === 'EGP') return order.title;
  const amount = Number(order.amount_sar).toLocaleString('en-US', { maximumFractionDigits: 2 });
  // Keep the Arabic currency and Latin digits together inside mixed-direction
  // provider headings. Non-breaking spaces also prevent separating the unit.
  return `\u2067\u2066${amount}\u2069\u00a0ريال\u00a0سعودي\u2069 — \u2067${order.title}\u2069`;
}
