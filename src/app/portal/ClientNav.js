"use client";

import { useEffect, useState } from "react";
import FilesIcon from "@/app/components/FilesIcon";
import SupportIcon from "@/app/components/SupportIcon";

// Client-side so the highlighted item reflects which section is actually
// selected (matching the admin sidebar's route-based .active) instead of
// being hardcoded on "نظرة عامة" forever — previously nothing updated when
// a different item was clicked, and on touch devices :hover made whichever
// item you scrolled past *look* selected even though nothing was tapped.
export default function ClientNav() {
  const [active, setActive] = useState("#overview");

  useEffect(() => {
    setActive(window.location.hash || "#overview");
    function onHashChange() {
      setActive(window.location.hash || "#overview");
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <nav className="client-nav">
      <a className={active === "#overview" ? "active" : ""} href="#overview" onClick={() => setActive("#overview")}>
        <span className="ico nav-image-icon">
          <img src="/admin-ui/icons/binocular.png" alt="" />
        </span>{" "}
        نظرة عامة
      </a>
      <a className={active === "#projects" ? "active" : ""} href="#projects" onClick={() => setActive("#projects")}>
        <span className="ico nav-image-icon">
          <img src="/admin-ui/icons/project-management.png" alt="" />
        </span>{" "}
        إدارة مشاريعي
      </a>
      <a className={active === "#payments" ? "active" : ""} href="#payments" onClick={() => setActive("#payments")}>
        <span className="ico nav-image-icon">
          <img src="/admin-ui/icons/checklist.png" alt="" />
        </span>{" "}
        مراحل الإنتاج والسداد
      </a>
      <a className={active === "#workflow" ? "active" : ""} href="#workflow" onClick={() => setActive("#workflow")}>
        <span>
          <FilesIcon size="1.5em" />
        </span>{" "}
        الملفات والتسليمات
      </a>
      <a href="https://wa.me/966507069605" target="_blank" rel="noopener noreferrer">
        <span>
          <SupportIcon size="1.5em" />
        </span>{" "}
        الدعم الفني
      </a>
    </nav>
  );
}
