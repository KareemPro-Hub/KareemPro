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
      className="btn btn-outline btn-sm btn-danger"
      style={{ flexShrink: 0 }}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "جارِ الحذف..." : "حذف"}
    </button>
  );
}
