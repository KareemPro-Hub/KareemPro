// Two-people icon — used for "فريق العمل" nav links.
export default function TeamIcon({ size = "1em", color = "currentColor", style = {} }) {
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
      <circle cx="8.7" cy="8.2" r="3.2" />
      <path d="M3.3 19c0-3.1 2.4-5.4 5.4-5.4s5.4 2.3 5.4 5.4" />
      <path d="M15 6.2a2.7 2.7 0 0 1 0 5.4" />
      <path d="M14.6 13.8c2.3.4 4 2.5 4 5.2" />
    </svg>
  );
}
