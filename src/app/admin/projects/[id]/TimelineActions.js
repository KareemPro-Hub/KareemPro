"use client";

import { useState, useTransition } from "react";
import { updateTimelineStep } from "@/app/admin/actions";

export default function TimelineActions({ projectId, currentStep }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const atStart = currentStep <= 1;
  const atEnd = currentStep >= 10;

  function move(delta) {
    setError(null);
    startTransition(async () => {
      try {
        await updateTimelineStep(projectId, currentStep + delta);
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => move(-1)}
          disabled={isPending || atStart}
        >
          ← رجوع مرحلة
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => move(1)}
          disabled={isPending || atEnd}
        >
          {isPending ? "جارِ التحديث..." : atEnd ? "اكتمل المشروع ✔" : "المرحلة التالية →"}
        </button>
      </div>
      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.6rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
