export function checkoutPackage(catalog, params) {
  const serviceId = params?.service;
  const tier = params?.tier;
  if (typeof serviceId !== 'string' || typeof tier !== 'string' || !/^[0-3]$/.test(tier)) return null;
  const service = catalog.find(s => s.id === serviceId);
  const pkg = service?.packages[Number(tier)];
  if (!pkg || !Number.isFinite(pkg.price) || pkg.price <= 0) return null;
  return { service, pkg, tier: Number(tier) };
}
