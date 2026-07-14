// Four joined hands forming a pinwheel — used for "فريق العمل" nav links.
// Solid glyph (fill, not stroke) since the reference icon is a filled shape;
// still driven by the `color` prop so it inherits the sidebar's active/hover tint.
const HAND_PATH =
  "M12.6 13.2 Q14 10.5 16.5 9.3 Q18.7 8.3 19.6 9.6 Q20.3 10.7 19 12.2 Q17 13.6 12.6 13.2 Z";

export default function TeamIcon({ size = "1em", color = "currentColor", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "inline-block", verticalAlign: "-0.15em", ...style }}
      aria-hidden="true"
    >
      <g fill={color}>
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 12 12)`}>
            <path d={HAND_PATH} />
            <circle cx="16.3" cy="12.6" r="1.4" />
            <line x1="19.6" y1="9.6" x2="22" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  );
}
