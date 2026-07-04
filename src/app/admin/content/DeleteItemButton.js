"use client";

import { useTransition } from "react";

export default function DeleteItemButton({ action, id, label }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`متأكد إنك عايز تحذف ${label} ده؟`)) return;
    startTransition(async () => {
      await action(id);
    });
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      style={{ color: "#ff9d84", borderColor: "rgba(255,85,53,0.4)", flexShrink: 0 }}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "جارِ الحذف..." : "حذف"}
    </button>
  );
}
