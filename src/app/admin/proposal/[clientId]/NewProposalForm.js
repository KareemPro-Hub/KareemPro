"use client";

import { useState } from "react";
import { createProposal } from "@/app/admin/actions";

export default function NewProposalForm({ clientId }) {
  const [packages, setPackages] = useState([{ name: "", price: "", features: "", featured: false }]);

  function update(i, field, value) {
    setPackages((p) => p.map((pkg, idx) => (idx === i ? { ...pkg, [field]: value } : pkg)));
  }
  function addPackage() {
    setPackages((p) => [...p, { name: "", price: "", features: "", featured: false }]);
  }
  function removePackage(i) {
    setPackages((p) => p.filter((_, idx) => idx !== i));
  }

  return (
    <form action={createProposal}>
      <input type="hidden" name="client_id" value={clientId} />

      <div className="card">
        <div className="field">
          <label>عنوان المشروع/النظام</label>
          <input
            type="text"
            name="project_title"
            required
            placeholder="مثال: منصة تعليمية متكاملة"
          />
        </div>
      </div>

      <h2 className="title" style={{ fontSize: "1.1rem", marginTop: "1.4rem" }}>
        الباقات
      </h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        صاحب المشروع هيشوف الباقات دي ويختار منها واحدة لما يوافق.
      </p>

      {packages.map((pkg, i) => (
        <div className="card" key={i} style={{ marginBottom: "1rem" }}>
          <div className="stage-head" style={{ marginBottom: "0.8rem" }}>
            <span className="stage-title">باقة {i + 1}</span>
            {packages.length > 1 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => removePackage(i)}
              >
                حذف
              </button>
            )}
          </div>
          <div className="field">
            <label>اسم الباقة</label>
            <input
              type="text"
              name="package_name[]"
              required
              value={pkg.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="مثال: الباقة الأساسية"
            />
          </div>
          <div className="field">
            <label>السعر</label>
            <input
              type="number"
              name="package_price[]"
              required
              min="0"
              step="0.01"
              value={pkg.price}
              onChange={(e) => update(i, "price", e.target.value)}
            />
          </div>
          <div className="field">
            <label>المميزات (سطر لكل ميزة)</label>
            <textarea
              name="package_features[]"
              rows={4}
              value={pkg.features}
              onChange={(e) => update(i, "features", e.target.value)}
              placeholder={"مميزة 1\nمميزة 2\nمميزة 3"}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            <input
              type="checkbox"
              checked={pkg.featured}
              onChange={(e) => update(i, "featured", e.target.checked)}
            />
            الأكثر طلبًا (تظهر بشارة مميزة للعميل)
          </label>
          <input type="hidden" name="package_featured[]" value={pkg.featured ? "true" : "false"} />
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline"
        onClick={addPackage}
        style={{ marginBottom: "1.5rem" }}
      >
        + إضافة باقة
      </button>

      <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
        إرسال العرض للعميل
      </button>
    </form>
  );
}
