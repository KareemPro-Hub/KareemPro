// Document with a download arrow — used for the "مركز التسليم" nav link.
// Drawn as a thin stroke (not the uploaded filled path, which rendered too
// heavy next to the other nav glyphs) so it matches the light, airy weight
// of the rest of the sidebar. Inline SVG so it inherits the active/hover
// tint through `color` and stays sharp at any size.
export default function DeliveryIcon({ size = "1em", color = "currentColor", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-0.15em", ...style }}
      aria-hidden="true"
    >
      {/* page outline with the folded corner */}
      <path d="M14.5 2.2H7A3.5 3.5 0 0 0 3.5 5.7v12.6A3.5 3.5 0 0 0 7 21.8h10a3.5 3.5 0 0 0 3.5-3.5V8.2L14.5 2.2Z" />
      <path d="M14.3 2.4v4.3a1.6 1.6 0 0 0 1.6 1.6h4.4" />
      {/* download arrow */}
      <path d="M12 10.6v6.2" />
      <path d="M9.2 14.3 12 17.1l2.8-2.8" />
    </svg>
  );
}
