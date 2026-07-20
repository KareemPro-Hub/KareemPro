// Three people (two behind, one in front) — used for "فريق العمل" nav links.
// Stroke glyph driven by the `color` prop so it inherits the sidebar's
// active/hover tint. Drawn inline (not a PNG) so it stays razor-sharp at any
// size and needs no extra network request.
export default function TeamIcon({ size = "1em", color = "currentColor", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-0.15em", ...style }}
      aria-hidden="true"
    >
      {/* back-left person */}
      <circle cx="6" cy="4.6" r="2.6" />
      <path d="M1.6 13.4a4.4 4.4 0 0 1 4.4-4.4" />
      {/* back-right person */}
      <circle cx="18" cy="4.6" r="2.6" />
      <path d="M22.4 13.4a4.4 4.4 0 0 0-4.4-4.4" />
      {/* front-center person */}
      <circle cx="12" cy="11.4" r="2.8" />
      <path d="M6.6 21.6a5.4 5.4 0 0 1 10.8 0" />
    </svg>
  );
}
