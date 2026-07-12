// Shared payment-stage status → color/label/icon mapping.
// Used by both the compact "luxe" payment summary widget and the
// production/payment accordion on the client portal dashboard.
export const PAY_STATUS_STYLE = {
  paid: { color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "✓", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  in_progress: { color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "✓", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  completed: { color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "✓", ring: "linear-gradient(135deg,#3fae66,#2f8a4e)" },
  awaiting_payment: { color: "#c1590a", bg: "rgba(255,140,40,.14)", icon: "…", ring: "linear-gradient(135deg,#ff7b27,#ffad38)" },
  upcoming: { color: "#8a7466", bg: "rgba(120,70,30,.08)", icon: "…", ring: "linear-gradient(135deg,#c8b6a6,#a68f7c)" },
};

export const PAY_STATUS_LABEL = {
  paid: "مدفوعة",
  in_progress: "مدفوعة",
  completed: "مدفوعة",
  awaiting_payment: "بانتظار السداد",
  upcoming: "قيد الانتظار",
};
