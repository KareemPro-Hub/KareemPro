import RiyalIcon from "./RiyalIcon";

export default function Money({ value, size = "0.85em", tone = "dark" }) {
  return (
    <span>
      <span dir="ltr">{Number(value || 0).toLocaleString("en-US")}</span>
      <RiyalIcon size={size} tone={tone} />
    </span>
  );
}
