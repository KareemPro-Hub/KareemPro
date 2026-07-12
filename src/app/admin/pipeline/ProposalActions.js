"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteProposal } from "@/app/admin/actions";
import { MoreIcon, TrashIcon, EyeIcon } from "../AdminIcons";

export default function ProposalActions({ proposalId, clientId, projectTitle }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();

  const closeMenu = useCallback(() => setOpen(false), []);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 200;
      setCoords({
        top: rect.bottom + 8,
        left: Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8),
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    }
    function handleScrollOrResize() {
      closeMenu();
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, closeMenu]);

  function handleDelete() {
    const ok = window.confirm(`متأكد إنك عايز تحذف عرض "${projectTitle}"؟ هيتحذف نهائيًا.`);
    if (!ok) return;

    setError(null);
    startDelete(async () => {
      try {
        await deleteProposal(proposalId);
        closeMenu();
      } catch (e) {
        setError(e.message || "حصل خطأ أثناء الحذف");
      }
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="more"
        onClick={(e) => {
          e.preventDefault();
          open ? closeMenu() : openMenu();
        }}
        aria-label="خيارات العرض"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        <MoreIcon />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
              width: "200px",
              background: "#ffffff",
              border: "1px solid #e9eef6",
              borderRadius: "14px",
              boxShadow: "0 16px 40px rgba(20,40,70,.24)",
              padding: "10px",
              textAlign: "right",
              fontFamily: "inherit",
            }}
          >
            <button
              type="button"
              onClick={() => {
                closeMenu();
                router.push(`/admin/proposal/${clientId}`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                textAlign: "right",
                background: "#fff",
                border: 0,
                borderRadius: "8px",
                padding: "9px 8px",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "#172541",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <EyeIcon />
              <span style={{ flex: 1 }}>عرض العرض</span>
            </button>

            <div style={{ height: "1px", background: "#e9eef6", margin: "8px 0" }} />

            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "100%",
                textAlign: "right",
                background: "#fdecef",
                border: "1px solid #f7c9d3",
                borderRadius: "8px",
                padding: "9px 8px",
                fontSize: "13px",
                fontFamily: "inherit",
                color: "#c81e3f",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              <TrashIcon /> {isDeleting ? "جارِ الحذف..." : "حذف العرض نهائيًا"}
            </button>

            {error && (
              <div style={{ fontSize: "11px", color: "#e0234a", padding: "6px 8px 0" }}>{error}</div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
