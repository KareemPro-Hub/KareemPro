"use client";

import { useState } from "react";
import RiyalIcon from "@/app/components/RiyalIcon";

// Always rendered on the dashboard's dark hero card — the light-toned
// symbol keeps real contrast against that dark background.
export default function AdminMoneyPrivacy({ value, className = "" }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className={`admin-private-money ${className}`}>
      <span dir="ltr">{visible ? Number(value || 0).toLocaleString("en-US") : "••••••"}</span>
      <span className="admin-riyal">
        <RiyalIcon tone="light" size="0.62em" style={{ margin: 0 }} />
      </span>
      <button type="button" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? "إخفاء المبلغ" : "إظهار المبلغ"}>
        {visible ? "◉" : "⊘"}
      </button>
    </span>
  );
}
