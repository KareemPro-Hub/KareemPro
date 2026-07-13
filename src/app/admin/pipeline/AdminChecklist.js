"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/app/admin/actions";

// A standing to-do/notes list for the admin — extra client requests or
// reminders tied to any project, jotted down free-form. Checking an item
// off never deletes it: it just sinks below the open items with a
// strikethrough, exactly as Kareem asked ("تنزل تحت ويتشطب عليها"). Local
// state is updated optimistically so the reorder/strikethrough feels
// instant, with the server action running behind it.
export default function AdminChecklist({ items }) {
  const [list, setList] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const { open, done } = useMemo(() => {
    const open = list
      .filter((i) => !i.is_checked)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const done = list
      .filter((i) => i.is_checked)
      .sort((a, b) => new Date(b.checked_at || b.created_at) - new Date(a.checked_at || a.created_at));
    return { open, done };
  }, [list]);

  function handleAdd(formData) {
    const text = (formData.get("text") || "").toString().trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      try {
        const item = await addChecklistItem(text);
        setList((prev) => [item, ...prev]);
        formRef.current?.reset();
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleToggle(item) {
    const nextChecked = !item.is_checked;
    setError(null);
    setList((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, is_checked: nextChecked, checked_at: nextChecked ? new Date().toISOString() : null }
          : i
      )
    );
    startTransition(async () => {
      try {
        await toggleChecklistItem(item.id, nextChecked);
      } catch (e) {
        setList((prev) => prev.map((i) => (i.id === item.id ? item : i)));
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleDelete(item) {
    if (!window.confirm(`متأكد إنك عايز تحذف "${item.text}" ؟`)) return;
    setError(null);
    setList((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      try {
        await deleteChecklistItem(item.id);
      } catch (e) {
        setList((prev) => [...prev, item]);
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div className="admin-checklist-card">
      <div className="admin-checklist-title">
        <span>📝 ملاحظات وطلبات المشاريع</span>
        {list.length > 0 && (
          <span className="admin-checklist-count">
            {open.length} مفتوحة · {done.length} تمت
          </span>
        )}
      </div>

      <form ref={formRef} action={handleAdd} className="admin-checklist-form">
        <input
          type="text"
          name="text"
          placeholder="أضف ملاحظة أو طلب من عميل…"
          disabled={isPending}
        />
        <button type="submit" disabled={isPending}>
          + إضافة
        </button>
      </form>

      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.2rem" }}>
          {error}
        </div>
      )}

      <div className="admin-checklist-list">
        {list.length === 0 && <p className="muted">لسه مفيش ملاحظات مضافة.</p>}

        {open.map((item) => (
          <div className="admin-checklist-item" key={item.id}>
            <button
              type="button"
              className="admin-checklist-checkbox"
              onClick={() => handleToggle(item)}
              aria-label="تحديد كمنجزة"
            />
            <span className="admin-checklist-text">{item.text}</span>
            <button type="button" className="admin-checklist-delete" onClick={() => handleDelete(item)}>
              ✕
            </button>
          </div>
        ))}

        {open.length > 0 && done.length > 0 && <div className="admin-checklist-divider" />}

        {done.map((item) => (
          <div className="admin-checklist-item checked" key={item.id}>
            <button
              type="button"
              className="admin-checklist-checkbox checked"
              onClick={() => handleToggle(item)}
              aria-label="إعادة فتحها"
            >
              ✓
            </button>
            <span className="admin-checklist-text">{item.text}</span>
            <button type="button" className="admin-checklist-delete" onClick={() => handleDelete(item)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
