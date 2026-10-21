// Official Saudi Riyal currency symbol — replaces the word "ريال" / "SAR"
// everywhere an amount is shown on the site.
export default function RiyalIcon({ size = "0.85em", tone = "auto", style = {} }) {
  return (
    <span
      className="riyal-symbol"
      role="img"
      aria-label="ريال سعودي"
      style={{
        fontSize: size,
        color: tone === "dark" ? "#0a0e26" : tone === "light" ? "#fff" : "inherit",
        margin: "0 3px",
        ...style,
      }}
    />
  );
}

// Keep stored text intact while displaying currency names with the approved mark.
export function RiyalText({ children, ...props }) {
  if (typeof children !== "string") return children;
  return children.split(/(بالريال السعودي|الريال السعودي|ريال سعودي|بالريال|الريال|ريال)/g).map((part, index) =>
    /^(بالريال السعودي|الريال السعودي|ريال سعودي|بالريال|الريال|ريال)$/.test(part)
      ? <RiyalIcon key={index} {...props} /> : part
  );
}
