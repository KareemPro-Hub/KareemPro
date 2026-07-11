"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus, deleteProject } from "./actions";

const STATUS_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "on_hold", label: "متوقف مؤقتًا" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

export default function ProjectActions({ projectId, projectTitle, currentStatus }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleStatus(status) {
    setError(null);
    startTransition(async () => {
      try {
        await updateProjectStatus(projectId, status);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e.message || "حصل خطأ");
      }
    });
  }

  function handleDelete() {
    const ok = window.confirm(
      `متأكد إنك عايز تحذف مشروع "${projectTitle}"؟ هتتحذف كل مراحل السداد بتاعته معاه نهائيًا.`
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteProject(projectId);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء الحذف");
      }
    });
  }

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="more"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-label="خيارات المشروع"
      >
        •••
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            marginTop: "6px",
            zIndex: 30,
            minWidth: "190px",
            background: "#fff",
            border: "1px solid #e9eef6",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(35,86,137,.16)",
            padding: "8px",
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: "10px", color: "#8b99af", padding: "4px 8px" }}>الحالة</div>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isPending || opt.value === currentStatus}
              onClick={() => handleStatus(opt.value)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "right",
                background: opt.value === currentStatus ? "#f1f6fc" : "none",
                border: 0,
                borderRadius: "8px",
                padding: "8px",
                fontSize: "12px",
                fontFamily: "inherit",
                color: "#172541",
                cursor: opt.value === currentStatus ? "default" : "pointer",
                fontWeight: opt.value === currentStatus ? 700 : 500,
              }}
            >
              {opt.value === currentStatus ? "✓ " : ""}
              {opt.label}
            </button>
          ))}

          <div style={{ height: "1px", background: "#e9eef6", margin: "6px 0" }} />

          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            style={{
              display: "block",
              width: "100%",
              textAlign: "right",
              background: "none",
              border: 0,
              borderRadius: "8px",
              padding: "8px",
              fontSize: "12px",
              fontFamily: "inherit",
              color: "#e0234a",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {isPending ? "جارِ التنفيذ..." : "حذف المشروع"}
          </button>

          {error && (
            <div style={{ fontSize: "10px", color: "#e0234a", padding: "4px 8px" }}>{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
