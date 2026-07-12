// Stacked-documents icon — used for "الملفات والتسليمات" nav links.
export default function FilesIcon({ size = "1em", color = "currentColor", style = {} }) {
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
      <path d="M3 6.5v11a2 2 0 0 0 2 2h2" />
      <path d="M5.5 4.2v12.6a2 2 0 0 0 2 2h9" />
      <path d="M8.5 2.5h7l4 4v11.3a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-13.3a2 2 0 0 1 2-2Z" />
      <path d="M15.5 2.5v3a1 1 0 0 0 1 1h3" />
      <line x1="9.3" y1="10.2" x2="16" y2="10.2" />
      <line x1="9.3" y1="12.8" x2="16" y2="12.8" />
      <line x1="9.3" y1="15.4" x2="14.3" y2="15.4" />
    </svg>
  );
}
