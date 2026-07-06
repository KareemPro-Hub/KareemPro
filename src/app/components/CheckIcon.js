// Professional checkmark icon — replaces the plain "✔" text character
// everywhere a step/stage/project is marked as done or completed.
export default function CheckIcon({ size = "1em", color = "currentColor", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "inline-block", verticalAlign: "-0.15em", ...style }}
      aria-hidden="true"
    >
      <path
        d="M4.5 12.5L9.5 17.5L19.5 6.5"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
