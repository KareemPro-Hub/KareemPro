"use client";

import { useState, useTransition } from "react";
import { updateTimelineStep } from "@/app/admin/actions";

// `steps` is the ordered list of step KEYS that actually apply to this
// project's package (e.g. economic packages have no app_start/app_beta/
// app_review/app_approved steps). Moving "forward/back" walks this list by
// position rather than assuming any fixed numbering, so every package tier
// (with its own step count) advances correctly.
export default function TimelineActions({ projectId, currentStep, steps }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const idx = steps.indexOf(currentStep);
  const prevStep = idx > 0 ? steps[idx - 1] : null;
  const nextStep = idx !== -1 && idx < steps.length - 1 ? steps[idx + 1] : null;

  function move(step) {
    if (!step) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateTimelineStep(projectId, step);
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
          onClick={() => move(prevStep)}
          disabled={isPending || !prevStep}
        >
          ← رجوع مرحلة
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => move(nextStep)}
          disabled={isPending || !nextStep}
        >
          {isPending ? "جارِ التحديث..." : nextStep ? "المرحلة التالية →" : "اكتمل المشروع ✔"}
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
