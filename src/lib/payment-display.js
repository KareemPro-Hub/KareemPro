// Display only: never derive charge amounts or payment confirmation from labels.
export function paymentDisplay(selected, order) {
  const project = selected.service.name.replace(/^(?:تطوير|إنشاء)\s+/u, '').trim();
  const packageName = (selected.packageName || (!selected.stageId ? selected.pkg.name.split('|')[0] : '')).trim();
  const ordinals = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
  const stage = selected.stageId
    ? `الدفعة ${ordinals[selected.stageNumber - 1] || selected.stageNumber || ''}`.trim()
    : 'سداد الباقة';
  return {
    heading: packageName ? `${project} «${packageName}»` : project,
    stage,
    amountSar: Number(order.amount_sar),
    amountEgpMinor: Number(order.amount_egp_minor),
    egyptian: selected.pkg.currency === 'EGP',
  };
}
