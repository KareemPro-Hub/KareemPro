"use client";

import { useState } from "react";
import { createProject } from "@/app/admin/actions";
import RiyalIcon from "@/app/components/RiyalIcon";

export default function NewProjectForm({ clients }) {
  const [stages, setStages] = useState([{ title: "", description: "", amount: "" }]);

  function updateStage(i, field, value) {
    setStages((s) => s.map((st, idx) => (idx === i ? { ...st, [field]: value } : st)));
  }
  function addStage() {
    setStages((s) => [...s, { title: "", description: "", amount: "" }]);
  }
  function removeStage(i) {
    setStages((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <form action={createProject}>
      <div className="field">
        <label>العميل</label>
        <select name="client_id" required>
          <option value="">اختر العميل</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} — {c.email}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>اسم المشروع</label>
        <input type="text" name="title" required placeholder="مثال: منصة إدارة العيادات" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="field">
          <label>اسم الباقة</label>
          <input type="text" name="package_name" required placeholder="الباقة الاحترافية" />
        </div>
        <div className="field">
          <label>
            إجمالي سعر الباقة <RiyalIcon size="0.75em" />
          </label>
          <input type="number" name="package_price" required min="0" step="0.01" />
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.4rem 0" }} />

      <h2 className="title" style={{ fontSize: "1.1rem" }}>
        مراحل المشروع
      </h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        مجموع قيم المراحل من الأفضل يساوي سعر الباقة الكلي.
      </p>

      {stages.map((stage, i) => (
        <div className="card" key={i} style={{ marginBottom: "1rem" }}>
          <div className="stage-head" style={{ marginBottom: "0.8rem" }}>
            <span className="stage-title">مرحلة {i + 1}</span>
            {stages.length > 1 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => removeStage(i)}
              >
                حذف
              </button>
            )}
          </div>
          <div className="field">
            <label>عنوان المرحلة</label>
            <input
              type="text"
              name="stage_title[]"
              required
              value={stage.title}
              onChange={(e) => updateStage(i, "title", e.target.value)}
              placeholder="مثال: التصميم وواجهات المستخدم"
            />
          </div>
          <div className="field">
            <label>وصف مختصر (اختياري)</label>
            <textarea
              name="stage_description[]"
              rows={2}
              value={stage.description}
              onChange={(e) => updateStage(i, "description", e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              قيمة المرحلة <RiyalIcon size="0.75em" />
            </label>
            <input
              type="number"
              name="stage_amount[]"
              required
              min="0"
              step="0.01"
              value={stage.amount}
              onChange={(e) => updateStage(i, "amount", e.target.value)}
            />
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-outline" onClick={addStage} style={{ marginBottom: "1.5rem" }}>
        + إضافة مرحلة
      </button>

      <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
        إنشاء المشروع
      </button>
    </form>
  );
}
