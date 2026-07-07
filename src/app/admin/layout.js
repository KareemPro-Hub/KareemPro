"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

function todayLabel() {
  return new Date().toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// /admin/login keeps its own dark cinematic design (glass card + glow blobs)
// and must NOT get the topbar/sidebar/light theme — every other /admin route
// gets the shared light dashboard shell: a gradient top navbar (matching the
// reference template's colored header) plus a persistent sidebar.
export default function AdminLayout({ children }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return children;
  }

  return (
    <div className="admin-light">
      <div className="admin-topbar">
        <a href="/admin" className="admin-topbar-brand">
          KAREEM PRO — لوحة التحكم
        </a>
        <div className="admin-topbar-right">
          <span className="admin-topbar-date">📅 {todayLabel()}</span>
          <span className="admin-topbar-avatar">K</span>
        </div>
      </div>
      <div className="admin-shell-with-sidebar">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
