export function checkoutPackage(catalog, params) {
  const serviceId = params?.service;
  const tier = params?.tier;
  if (typeof serviceId !== 'string' || typeof tier !== 'string' || !/^[0-3]$/.test(tier)) return null;
  // Fixed-price, unlisted live payment check; never accept an amount from the URL.
  const service = serviceId === 'payment-check' ? {
    id: 'payment-check',
    name: 'تجربة دفع حقيقية',
    packages: [{
      name: 'تجربة الدفع|مبلغ صغير لتجربة السداد ببطاقتك.',
      price: 10,
      features: 'سداد حقيقي يُخصم من بطاقتك عند تأكيد الدفع.\nيُحتسب المبلغ بالجنيه المصري وفق القيمة الموضحة قبل السداد.\nهذا الطلب مخصص لتجربة الدفع ولا يتضمن شراء باقة خدمات.',
    }],
  } : catalog.find(s => s.id === serviceId);
  const pkg = service?.packages[Number(tier)];
  if (!pkg || !Number.isFinite(pkg.price) || pkg.price <= 0) return null;
  return { service, pkg, tier: Number(tier) };
}
