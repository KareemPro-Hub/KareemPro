// Wallet outline — used for the "المحفظة" nav link. Drawn as a thin stroke
// (not the uploaded filled path, which rendered too heavy next to the other
// nav glyphs) so it matches the light, airy weight of the rest of the
// sidebar. Inline SVG so it inherits the active/hover tint through `color`
// and stays sharp at any size.
export default function WalletIcon({ size = "1em", color = "currentColor", style = {} }) {
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
      {/* body + the flap that folds over the top edge */}
      <path d="M3 6.5h16A2.5 2.5 0 0 1 21.5 9v9a2.5 2.5 0 0 1-2.5 2.5H6A3.5 3.5 0 0 1 2.5 17V6.2A2.7 2.7 0 0 1 5.2 3.5H20" />
      {/* clasp */}
      <circle cx="17.4" cy="13.6" r="1" />
    </svg>
  );
}
