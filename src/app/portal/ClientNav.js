"use client";

import { useEffect, useState } from "react";
import FilesIcon from "@/app/components/FilesIcon";
import SupportIcon from "@/app/components/SupportIcon";

// "إدارة مشاريعي" (#projects) is its own isolated view — only the project
// list from the uploaded design, nothing else — while every other item
// shows the normal project detail (hero + payments + production track).
// `data-view` on the scrollable panel drives that via CSS; we flip it
// ourselves (instead of relying on the browser's native hash-jump) so the
// section is already visible before we scroll to it.
function applyView(hash) {
  const panel = document.querySelector(".client-dashboard-main");
  if (!panel) return;
  panel.dataset.view = hash === "#projects" ? "projects" : hash === "#support" ? "support" : "detail";
}

export default function ClientNav() {
  const [active, setActive] = useState("#overview");

  useEffect(() => {
    const initial = window.location.hash || "#overview";
    setActive(initial);
    applyView(initial);
    function onHashChange() {
      const hash = window.location.hash || "#overview";
      setActive(hash);
      applyView(hash);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function handleClick(e, href) {
    e.preventDefault();
    setActive(href);
    applyView(href);
    if (typeof window !== "undefined" && window.location.hash !== href) {
      history.replaceState(null, "", href);
    }
    requestAnimationFrame(() => {
      document.querySelector(href)?.scrollIntoView({ block: "start" });
    });
  }

  return (
    <nav className="client-nav">
      <a className={active === "#overview" ? "active" : ""} href="#overview" onClick={(e) => handleClick(e, "#overview")}>
        <span className="ico nav-image-icon">
          <img src="/admin-ui/icons/binocular.png" alt="" />
        </span>{" "}
        نظرة عامة
      </a>
      <a className={active === "#projects" ? "active" : ""} href="#projects" onClick={(e) => handleClick(e, "#projects")}>
        <span className="ico nav-image-icon">
          <img src="/admin-ui/icons/project-management.png" alt="" />
        </span>{" "}
        إدارة مشاريعي
      </a>
      <a className={active === "#payments" ? "active" : ""} href="#payments" onClick={(e) => handleClick(e, "#payments")}>
        <span className="ico nav-image-icon">
          <img src="/admin-ui/icons/checklist.png" alt="" />
        </span>{" "}
        مراحل الإنتاج والسداد
      </a>
      <a className={active === "#workflow" ? "active" : ""} href="#workflow" onClick={(e) => handleClick(e, "#workflow")}>
        <span>
          <FilesIcon size="1.5em" />
        </span>{" "}
        الملفات والتسليمات
      </a>
      <a className={active === "#support" ? "active" : ""} href="#support" onClick={(e) => handleClick(e, "#support")}>
        <span>
          <SupportIcon size="1.5em" />
        </span>{" "}
        الدعم الفني
      </a>
    </nav>
  );
}
