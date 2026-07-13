"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { addMyNote, sendMyNoteToAdmin, deleteMyNote } from "./notes-actions";

// A private notes/ideas box for the client — same spirit as the admin's own
// checklist, but sending is an explicit, separate step: nothing reaches
// Kareem until the client hits "إرسال لكريم" on a specific note (see
// notes-actions.js). Once sent, the note is locked (badge only, no re-send)
// so it's always clear what actually landed on his side.
export default function ClientNotes({ notes, projectOptions }) {
  const [list, setList] = useState(notes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const formRef = useRef(null);

  const sorted = useMemo(
    () => [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [list]
  );

  function handleAdd(formData) {
    const text = (formData.get("text") || "").toString().trim();
    const projectId = (formData.get("project_id") || "").toString().trim() || null;
    if (!text) return;
    setError(null);
    startTransition(async () => {
      try {
        const note = await addMyNote(text, projectId);
        setList((prev) => [note, ...prev]);
        formRef.current?.reset();
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleSend(note) {
    setError(null);
    setSendingId(note.id);
    startTransition(async () => {
      try {
        await sendMyNoteToAdmin(note.id);
        setList((prev) =>
          prev.map((n) =>
            n.id === note.id ? { ...n, sent_to_admin: true, sent_at: new Date().toISOString() } : n
          )
        );
      } catch (e) {
        setError(e.message || "حصل خطأ");
      } finally {
        setSendingId(null);
      }
    });
  }

  function handleDelete(note) {
    if (!window.confirm(`متأكد إنك عايز تحذف "${note.text}" ؟`)) return;
    setError(null);
    setList((prev) => prev.filter((n) => n.id !== note.id));
    startTransition(async () => {
      try {
        await deleteMyNote(note.id);
      } catch (e) {
        setList((prev) => [...prev, note]);
        setError(e.message || "حصل خطأ");
      }
    });
  }

  return (
    <div className="client-notes-card">
      <div className="client-notes-title">
        <span>💡 أفكارك وملاحظاتك</span>
        <span className="client-notes-sub">دوّن أي فكرة أو طلب، وابعتها لكريم لما تكون جاهزة</span>
      </div>

      <form ref={formRef} action={handleAdd} className="client-notes-form">
        {projectOptions && projectOptions.length > 1 && (
          <select name="project_id" disabled={isPending} defaultValue="">
            <option value="">بدون مشروع محدد</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        <input type="text" name="text" placeholder="اكتب فكرتك أو ملاحظتك هنا…" disabled={isPending} />
        <button type="submit" disabled={isPending}>
          + إضافة ملاحظة
        </button>
      </form>

      {error && (
        <div className="notice notice-error" style={{ marginTop: "0.2rem" }}>
          {error}
        </div>
      )}

      <div className="client-notes-list">
        {sorted.length === 0 && <p className="muted">لسه مفيش ملاحظات مضافة.</p>}

        {sorted.map((note) => (
          <div className="client-notes-item" key={note.id}>
            <div className="client-notes-item-text">
              {note.projects?.title && <span className="client-notes-project">{note.projects.title}</span>}
              {note.text}
            </div>
            <div className="client-notes-item-actions">
              {note.sent_to_admin ? (
                <span className="client-notes-sent-badge">تم الإرسال إلى كريم ✓</span>
              ) : (
                <button
                  type="button"
                  className="client-notes-send-btn"
                  onClick={() => handleSend(note)}
                  disabled={isPending && sendingId === note.id}
                >
                  {isPending && sendingId === note.id ? "جارِ الإرسال..." : "إرسال لكريم ↗"}
                </button>
              )}
              <button type="button" className="client-notes-delete" onClick={() => handleDelete(note)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
