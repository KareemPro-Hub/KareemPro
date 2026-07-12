// Official Saudi Riyal currency symbol — replaces the word "ريال" / "SAR"
// everywhere an amount is shown on the site.
export default function RiyalIcon({ size = "0.85em", tone = "dark", style = {} }) {
  return (
    <img
      src={tone === "dark" ? "/riyal-symbol-black.png" : "/riyal-symbol-white.png"}
      alt="ريال"
      style={{
        height: size,
        width: "auto",
        display: "inline-block",
        verticalAlign: "-0.05em",
        margin: "0 3px",
        ...style,
      }}
    />
  );
}
