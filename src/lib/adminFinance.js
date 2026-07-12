// Shared real-data helpers used across the admin dashboard pages (overview,
// clients, projects, wallet) — kept in one place so the financial math
// (contracted / collected / pending) is defined exactly once.

export const PROPOSAL_LABEL = {
  pending: "بانتظار قرار صاحب المشروع",
  accepted: "تمت الموافقة ✅",
  rejected: "مرفوض ⚠️",
};

export function clientFinance(client) {
  let contracted = 0;
  let collected = 0;
  (client.projects || []).forEach((p) => {
    contracted += Number(p.package_price) || 0;
    (p.stages || []).forEach((s) => {
      if (["paid", "in_progress", "completed"].includes(s.status)) {
        collected += Number(s.amount) || 0;
      }
    });
  });
  return { contracted, collected, pending: Math.max(contracted - collected, 0) };
}

export function sumFinances(clients) {
  return (clients || []).reduce(
    (acc, c) => {
      const f = clientFinance(c);
      return {
        contracted: acc.contracted + f.contracted,
        collected: acc.collected + f.collected,
        pending: acc.pending + f.pending,
      };
    },
    { contracted: 0, collected: 0, pending: 0 }
  );
}

const PROJECT_STATUS_LABEL = {
  active: "نشط",
  completed: "مكتمل",
  on_hold: "متوقف مؤقتًا",
  cancelled: "ملغي",
};

export function projectStatusLabel(status) {
  return PROJECT_STATUS_LABEL[status] || status;
}
