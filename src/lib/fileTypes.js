// Shared file-type taxonomy for "الملفات والتسليمات" — used by both the
// admin upload UI and the client-facing list so labels/icons/colors never
// drift between the two.
export const FILE_TYPE_META = {
  design: { label: "أعمال المشروع", color: "#8a4ac1", bg: "rgba(138,74,193,.12)", icon: "🎨" },
  doc: { label: "مستند", color: "#7a6a5a", bg: "rgba(120,100,80,.12)", icon: "📄" },
  contract: { label: "عقد", color: "#2f8a4e", bg: "rgba(47,138,78,.12)", icon: "📝" },
  invoice: { label: "فاتورة", color: "#c1590a", bg: "rgba(255,173,56,.18)", icon: "🧾" },
  link: { label: "رابط", color: "#2a6fb0", bg: "rgba(42,111,176,.12)", icon: "🔗" },
};

export const FILE_TYPE_OPTIONS = [
  { key: "design", label: "أعمال المشروع (تصميم)" },
  { key: "doc", label: "مستند" },
  { key: "contract", label: "عقد" },
  { key: "invoice", label: "فاتورة" },
  { key: "link", label: "رابط" },
];

export function formatFileSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
