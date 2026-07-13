"use client";

import { useMemo, useState, useTransition } from "react";
import { setMyTaskDone } from "./actions";
import { taskEffectiveStatus, formatTeamAmount } from "@/lib/teamTasks";

// The whole team-member portal, on purpose: one simple page, no sidebar, no
// navigation — just "here's what you're owed, here's what's left to do."
export default function MyTasks({ tasks: initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const { open, done, totalOwed } = useMemo(() => {
    const open = tasks.filter((t) => taskEffectiveStatus(t) !== "done");
    const done = tasks.filter((t) => taskEffectiveStatus(t) === "done");
    const totalOwed = tasks
      .filter((t) => t.payment_status !== "paid" && t.amount != null)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { open, done, totalOwed };
  }, [tasks]);

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tasks]
  );

  function handleDone(task) {
    setError(null);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "done" } : t)));
    startTransition(async () => {
      try {
        await setMyTaskDone(task.id, true);
      } catch (e) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div className="team-portal-wrap">
      <div className="team-portal-stats">
        <div className="team-portal-stat-card">
          <div className="team-portal-stat-label">مهام مفتوحة</div>
          <div className="team-portal-stat-value">{open.length}</div>
        </div>
        <div className="team-portal-stat-card">
          <div className="team-portal-stat-label">مهام منجزة</div>
          <div className="team-portal-stat-value">{done.length}</div>
        </div>
        <div className="team-portal-stat-card">
          <div className="team-portal-stat-label">إجمالي المستحق</div>
          <div className="team-portal-stat-value">{formatTeamAmount(totalOwed) || "0 جنيه"}</div>
        </div>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      <div className="team-portal-list">
        {sorted.length === 0 && <p className="muted">لسه مفيش مهام متكلّفة بيها.</p>}

        {sorted.map((t) => {
          const eff = taskEffectiveStatus(t);
          const hasProject = t.project_label && t.project_label !== "عام";
          return (
            <div className="team-portal-task-row" key={t.id}>
              <div className="team-portal-task-info">
                <div className={`team-portal-task-title${eff === "done" ? " done" : ""}`}>{t.title}</div>
                {hasProject && <div className="team-portal-task-project">{t.project_label}</div>}
              </div>

              {t.amount != null && <div className="team-portal-task-amount">{formatTeamAmount(t.amount)}</div>}

              {eff === "done" ? (
                <span className="team-portal-done-badge">✓ منجزة</span>
              ) : (
                <button
                  type="button"
                  className="team-portal-done-btn"
                  onClick={() => handleDone(t)}
                  disabled={isPending}
                >
                  تم الإنجاز
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
