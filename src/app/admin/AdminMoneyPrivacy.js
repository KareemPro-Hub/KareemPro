"use client";

import { useState } from "react";

export default function AdminMoneyPrivacy({ value, className = "" }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className={`admin-private-money ${className}`}>
      <span dir="ltr">{visible ? Number(value || 0).toLocaleString("en-US") : "••••••"}</span>
      <span className="admin-riyal">ريال</span>
      <button type="button" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? "إخفاء المبلغ" : "إظهار المبلغ"}>
        {visible ? "◉" : "⊘"}
      </button>
    </span>
  );
}
