"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  inviteTeamMember,
  addTeamTask,
  toggleTeamTaskDone,
  markTeamTaskPaid,
  deleteTeamTask,
} from "@/app/admin/actions";
import { taskEffectiveStatus, TASK_STATUS_META, taskDueLabel, formatTeamAmount } from "@/lib/teamTasks";

export default function TeamBoard({ members: initialMembers, tasks: initialTasks }) {
  const [members, setMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const taskFormRef = useRef(null);
  const memberFormRef = useRef(null);

  const memberStats = useMemo(
    () =>
      members.map((m) => {
        const own = tasks.filter((t) => t.assignee_id === m.id);
        return {
          ...m,
          open: own.filter((t) => taskEffectiveStatus(t) !== "done").length,
          done: own.filter((t) => taskEffectiveStatus(t) === "done").length,
        };
      }),
    [members, tasks]
  );

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tasks]
  );

  function handleAddTask(formData) {
    setError(null);
    startTransition(async () => {
      try {
        await addTeamTask(formData);
        // Server action already revalidates the page — but we also want the
        // form to close immediately without waiting on the round trip.
        taskFormRef.current?.reset();
        setShowNewTask(false);
        window.location.reload();
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleAddMember(formData) {
    setError(null);
    startTransition(async () => {
      try {
        await inviteTeamMember(formData);
        memberFormRef.current?.reset();
        setShowAddMember(false);
        window.location.reload();
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleToggleDone(task) {
    const nextDone = taskEffectiveStatus(task) !== "done";
    setError(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextDone ? "done" : "open" } : t))
    );
    startTransition(async () => {
      try {
        await toggleTeamTaskDone(task.id, nextDone);
      } catch (e) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleMarkPaid(task) {
    setError(null);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, payment_status: "paid" } : t)));
    startTransition(async () => {
      try {
        await markTeamTaskPaid(task.id);
      } catch (e) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleDeleteTask(task) {
    if (!window.confirm(`متأكد إنك عايز تحذف "${task.title}" ؟`)) return;
    setError(null);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => {
      try {
        await deleteTeamTask(task.id);
      } catch (e) {
        setTasks((prev) => [...prev, task]);
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div className="team-luxe-wrap">
      <div className="team-luxe-head">
        <div className="team-luxe-badge">فريق العمل</div>
        <div style={{ flex: 1 }} />
        <button type="button" className="team-luxe-btn secondary" onClick={() => setShowAddMember((v) => !v)}>
          + عضو جديد
        </button>
        <button type="button" className="team-luxe-btn primary" onClick={() => setShowNewTask((v) => !v)}>
          + مهمة جديدة
        </button>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {showAddMember && (
        <form ref={memberFormRef} action={handleAddMember} className="team-luxe-form">
          <div className="team-luxe-form-title">عضو جديد</div>
          <div className="team-luxe-form-grid">
            <div className="field">
              <label>اسم العضو</label>
              <input type="text" name="full_name" required placeholder="مثال: أم رودي" />
            </div>
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input type="email" name="email" required placeholder="you@example.com" dir="ltr" />
            </div>
            <div className="field">
              <label>الصفة (اختياري)</label>
              <input type="text" name="role_title" placeholder="مثال: مسؤولة" />
            </div>
          </div>
          <div className="team-luxe-form-actions">
            <button type="submit" className="team-luxe-btn primary" disabled={isPending}>
              {isPending ? "جارِ الإرسال..." : "إرسال الدعوة"}
            </button>
            <button type="button" className="team-luxe-btn" onClick={() => setShowAddMember(false)} disabled={isPending}>
              إلغاء
            </button>
          </div>
        </form>
      )}

      {showNewTask && (
        <form ref={taskFormRef} action={handleAddTask} className="team-luxe-form">
          <div className="team-luxe-form-title">مهمة جديدة</div>
          <div className="team-luxe-form-grid">
            <div className="field">
              <label>عنوان المهمة</label>
              <input type="text" name="title" required placeholder="مثال: تصميم شاشة الدخول" />
            </div>
            <div className="field">
              <label>موجهة إلى</label>
              <select name="assignee_id" required defaultValue={members[0]?.id || ""}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>اسم المشروع</label>
              <input type="text" name="project_label" placeholder="مثال: تطبيق نجم التوصيل" />
            </div>
            <div className="field">
              <label>موعد الاستحقاق</label>
              <input type="date" name="due_date" />
            </div>
            <div className="field">
              <label>السعر (اختياري)</label>
              <input type="text" name="amount" placeholder="مثال: 300" />
            </div>
          </div>
          <div className="team-luxe-form-actions">
            <button type="submit" className="team-luxe-btn primary" disabled={isPending || members.length === 0}>
              {isPending ? "جارِ الحفظ..." : "حفظ المهمة"}
            </button>
            <button type="button" className="team-luxe-btn" onClick={() => setShowNewTask(false)} disabled={isPending}>
              إلغاء
            </button>
          </div>
          {members.length === 0 && (
            <p className="muted" style={{ fontSize: "12.5px" }}>
              لازم تضيف عضو فريق واحد على الأقل الأول.
            </p>
          )}
        </form>
      )}

      {memberStats.length > 0 && (
        <div className="team-luxe-members">
          {memberStats.map((m) => (
            <div className="team-luxe-member-card" key={m.id}>
              <div className="team-luxe-member-name">{m.full_name}</div>
              {m.role_title && <div className="team-luxe-member-role">{m.role_title}</div>}
              <div className="team-luxe-member-stats">
                <div className="team-luxe-member-stat">
                  <span className="num open">{m.open}</span>
                  <span className="lbl">مفتوحة</span>
                </div>
                <div className="team-luxe-member-divider" />
                <div className="team-luxe-member-stat">
                  <span className="num done">{m.done}</span>
                  <span className="lbl">منجزة</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="team-luxe-tasks-card">
        <div className="team-luxe-tasks-title">كل المهام</div>

        {sortedTasks.length === 0 && <p className="muted">لسه مفيش مهام مضافة.</p>}

        <div className="team-luxe-tasks-list">
          {sortedTasks.map((t) => {
            const eff = taskEffectiveStatus(t);
            const meta = TASK_STATUS_META[eff];
            const member = members.find((m) => m.id === t.assignee_id);
            return (
              <div className="team-luxe-task-row" key={t.id}>
                <button
                  type="button"
                  className={`team-luxe-checkbox${eff === "done" ? " checked" : ""}`}
                  onClick={() => handleToggleDone(t)}
                  aria-label="تبديل حالة الإنجاز"
                >
                  {eff === "done" ? "✓" : ""}
                </button>
                <div className="team-luxe-task-info">
                  <div className={`team-luxe-task-title${eff === "done" ? " done" : ""}`}>{t.title}</div>
                  <div className="team-luxe-task-sub">
                    {member?.full_name || "—"} · {t.project_label}
                  </div>
                </div>
                <div className="team-luxe-task-due">{taskDueLabel(t)}</div>
                {t.amount != null && (
                  <div className="team-luxe-task-amount">
                    {formatTeamAmount(t.amount)}
                    {t.payment_status === "paid" ? (
                      <span className="team-luxe-paid-badge">تم الدفع</span>
                    ) : (
                      <button type="button" className="team-luxe-pay-btn" onClick={() => handleMarkPaid(t)}>
                        تعليم كمدفوعة
                      </button>
                    )}
                  </div>
                )}
                <span className="team-luxe-status" style={{ color: meta.color, background: meta.bg }}>
                  {meta.label}
                </span>
                <button type="button" className="team-luxe-delete" onClick={() => handleDeleteTask(t)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
