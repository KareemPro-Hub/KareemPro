"use client";

import { useTransition } from "react";
import { toggleDeliveryAction } from "@/app/admin/actions";

export default function DeliveryActionCard({ projectId, actionKey, icon, title, desc, doneAt }) {
  const [isPending, startTransition] = useTransition();
  const isDone = !!doneAt;

  function handleClick() {
    startTransition(async () => {
      await toggleDeliveryAction(projectId, actionKey);
    });
  }

  return (
    <div className={`delivery-luxe-action${isDone ? " done" : ""}`}>
      <div className="delivery-luxe-action-top">
        <div className="delivery-luxe-icon">{icon}</div>
        <div className={`delivery-luxe-status${isDone ? " done" : ""}`}>
          {isDone ? "تم" : "بانتظار الإجراء"}
        </div>
      </div>
      <div className="delivery-luxe-title">{title}</div>
      <div className="delivery-luxe-desc">{desc}</div>
      <button
        type="button"
        className={`delivery-luxe-btn${isDone ? " done" : ""}`}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "جارِ التنفيذ..." : isDone ? "تم — إلغاء" : "تنفيذ الآن"}
      </button>
    </div>
  );
}
