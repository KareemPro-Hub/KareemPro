// Joined-hands / handshake icon — used for "فريق العمل" nav links.
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
      <path d="M2.5 14.7l3-3a1.8 1.8 0 0 1 2.55 0l1.35 1.35" />
      <path d="M21.5 14.7l-3-3a1.8 1.8 0 0 0-2.55 0l-1.35 1.35" />
      <path d="M9.4 13.05l2.2 2.2c.6.6 1.6.6 2.2 0l.35-.35" />
      <path d="M7.55 16.6l1.8 1.8c.6.6 1.6.6 2.2 0" />
      <path d="M4.3 12.95L2.5 14.7v3.35l3 3" />
      <path d="M19.7 12.95l1.8 1.75v3.35l-3 3" />
    </svg>
  );
}
