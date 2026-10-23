// Small, shared line-icon set for admin action menus (•••, delete, resend, status).
// Kept as plain inline SVG (no external deps) so it matches the kp-dashboard's
// clean/professional line-icon language instead of using emoji.

export function MoreIcon() {
  return (
    <svg width="18" height="18" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#menu-dots-vertical"></use></svg>
  );
}

export function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"

     className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#trash"></use></svg>
  );
}

export function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"

     className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#refresh"></use></svg>
  );
}

export function EyeIcon() {
  return (
    <svg width="16" height="16" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#eye"></use></svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="14" height="14" className="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#check"></use></svg>
  );
}

export const STATUS_DOT_COLORS = {
  active: "#22c55e",
  on_hold: "#f5a623",
  completed: "#3b82f6",
  cancelled: "#e0234a",
};

export function StatusDot({ status }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: STATUS_DOT_COLORS[status] || "#98a6bd",
        flex: "0 0 auto",
      }}
    />
  );
}
