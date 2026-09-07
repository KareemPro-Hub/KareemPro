"use client";

import { useState, useTransition } from "react";
import { updateTimelineStep, updateProjectStatus } from "@/app/admin/actions";
import CheckIcon from "@/app/components/CheckIcon";

// `steps` is the ordered list of step KEYS that actually apply to this
// project's package (e.g. economic packages have no app_prep/app_testing_stores
// steps). Moving "forward/back" walks this list by position rather than
// assuming any fixed numbering, so every package tier (with its own step
// count) advances correctly.
export default function TimelineActions({ projectId, currentStep, steps, isProjectCompleted }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const idx = steps.indexOf(currentStep);
  const prevStep = idx > 0 ? steps[idx - 1] : null;
  const nextStep = idx !== -1 && idx < steps.length - 1 ? steps[idx + 1] : null;
  // Standing ON the last step is not completion — that step is still being
  // worked on. Completion is a separate, deliberate act: this button writes
  // projects.status = "completed", and pressing it again undoes it.
  const isOnLastStep = idx !== -1 && !nextStep;

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

  function toggleCompleted() {
    setError(null);
    startTransition(async () => {
      try {
        await updateProjectStatus(projectId, isProjectCompleted ? "active" : "completed");
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button
          className="proj-detail-btn"
          onClick={() => move(prevStep)}
          disabled={isPending || !prevStep}
        >
          <span>→</span> <span>رجوع مرحلة</span>
        </button>
        <button
          className="proj-detail-btn primary"
          onClick={() => (nextStep ? move(nextStep) : toggleCompleted())}
          disabled={isPending || (!nextStep && !isOnLastStep)}
        >
          {isPending ? (
            "جارِ التحديث..."
          ) : nextStep ? (
            <>
              <span>المرحلة التالية</span> <span>←</span>
            </>
          ) : isProjectCompleted ? (
            <>
              <span>إلغاء الاكتمال</span> <span>→</span>
            </>
          ) : (
            <>
              اكتمل المشروع <CheckIcon size="0.9em" />
            </>
          )}
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
