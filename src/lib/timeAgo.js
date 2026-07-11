// Small Arabic relative-time formatter for real activity feeds (no library).
export function timeAgo(dateInput) {
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "الآن";
  if (diffMs < hour) return `منذ ${Math.round(diffMs / minute)} د`;
  if (diffMs < day) return `منذ ${Math.round(diffMs / hour)} س`;
  const days = Math.round(diffMs / day);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.round(days / 30);
  return `منذ ${months} شهر`;
}
