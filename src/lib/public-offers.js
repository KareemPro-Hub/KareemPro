import offers from '../../public/service-offers.json';

// Copy into new proposals only. Previously saved proposals and contracts are immutable.
export function publicProposalPackages(serviceId) {
  const packages = offers[serviceId]?.packages;
  if (!packages) return null;
  return packages.map((pkg, index) => {
    let features = [];
    for (const inherited of packages.slice(0, index + 1)) {
      features.push(...inherited.features.split('\n').filter(line => !line.startsWith('كل مميزات') && !line.startsWith('دعم فني')));
    }
    if (serviceId === 'blog' && index > 0) {
      features = features.filter(line => !line.includes('مقالات هدية') && (!line.startsWith('كتابة ونشر') || line === pkg.features.split('\n').find(f => f.startsWith('كتابة ونشر'))));
      features.push('تسليم كامل الصلاحيات.');
    }
    if (index === 2 && serviceId !== 'blog') features = features.filter(line => !line.includes('WebView'));
    const support = pkg.features.split('\n').find(line => line.startsWith('دعم فني'));
    if (support) features.push(support);
    return { name: pkg.name, price: pkg.price, is_featured: pkg.is_featured, features: features.join('\n') };
  });
}

// The article total is read from this proposal's saved scope, not from today's prices.
export function currentBloggerArticleCount(pkg) {
  const features = pkg?.features || '';
  if (!/Blogger/.test(pkg?.name || '')) return null;
  const total = features.match(/كتابة ونشر (10|60) مقال(?:ات|ًا) احترافي(?:ة|ًا) إجمالًا/);
  if (total) return Number(total[1]);
  return features.includes('3 مقالات هدية') ? 3 : null;
}

export function currentBloggerCountFromName(name) {
  if (name?.includes('مدونة Blogger بهوية احترافية.')) return 3;
  const match = name?.match(/مدونة Blogger مع (10|60) مقال/);
  return match ? Number(match[1]) : null;
}

export function isPublicProposal(pkg) {
  return Object.values(offers).some(service => service.packages.some(p => p.name === pkg?.name && p.price === Number(pkg?.price)));
}

// Compact cards are used only for an exact match to the saved new proposal.
// Customized/older offers continue displaying their own saved scope verbatim.
export function publicPackageCardFeatures(pkg) {
  for (const [serviceId, service] of Object.entries(offers)) {
    const saved = publicProposalPackages(serviceId);
    const index = saved.findIndex(p => p.name === pkg?.name && p.price === Number(pkg?.price) && p.features === pkg?.features);
    if (index >= 0) return service.packages[index].features;
  }
  return pkg?.features || '';
}
