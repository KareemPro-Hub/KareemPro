// Headset + chat-bubble icon — used for "الدعم الفني" nav links.
export default function SupportIcon({ size = "1em", color = "currentColor", style = {} }) {
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
      <path d="M4 13.2v-1.4a8 8 0 0 1 16 0v1.4" />
      <rect x="2.4" y="13.2" width="3.3" height="5.2" rx="1.65" />
      <rect x="18.3" y="13.2" width="3.3" height="5.2" rx="1.65" />
      <path d="M18.3 18.4v.9a2 2 0 0 1-2 2h-2.1" />
      <circle cx="11.7" cy="12.4" r="3.7" />
      <path d="M9.3 15.4l-1.1 1.75 2.25-.7" />
      <line x1="9.9" y1="11.5" x2="13.5" y2="11.5" />
      <line x1="9.9" y1="13.2" x2="12.4" y2="13.2" />
    </svg>
  );
}
