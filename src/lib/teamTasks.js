// Shared helpers for "فريق العمل" tasks — used by both the admin task board
// and the team member's own "مهامي" page, so the due/status wording never
// drifts between the two.

// Real status derived from stored status + due_date — "late" isn't stored,
// it's computed (an open task whose due_date has passed).
export function taskEffectiveStatus(task) {
  if (task.status === "done") return "done";
  if (task.due_date && new Date(task.due_date) < new Date(new Date().toDateString())) return "late";
  return "open";
}

export const TASK_STATUS_META = {
  open: { label: "مفتوحة", color: "#c1590a", bg: "rgba(255,173,56,.18)" },
  late: { label: "متأخرة", color: "#b93a2e", bg: "rgba(185,58,46,.14)" },
  done: { label: "منجزة", color: "#2f8a4e", bg: "rgba(47,138,78,.14)" },
};

// Plain-language due label matching the uploaded design's copy exactly.
export function taskDueLabel(task) {
  if (task.status === "done") return "منجزة";
  if (!task.due_date) return "بدون موعد محدد";

  const today = new Date(new Date().toDateString());
  const due = new Date(task.due_date);
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return `متأخرة منذ ${days === 1 ? "يوم" : `${days} أيام`}`;
  }
  if (diffDays === 0) return "مستحقة اليوم";
  if (diffDays === 1) return "مستحقة خلال يوم";
  return `مستحقة خلال ${diffDays} أيام`;
}

// Team task amounts are priced in Egyptian pounds (internal family/team pay,
// distinct from the SAR client-facing pricing elsewhere on the platform).
export function formatTeamAmount(amount) {
  if (amount == null || amount === "") return "";
  return `${Number(amount).toLocaleString("en-US")} جنيه`;
}
