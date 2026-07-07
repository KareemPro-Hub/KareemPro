"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

// /admin/login keeps its own dark cinematic design (glass card + glow blobs)
// and must NOT get the sidebar or the light theme — every other /admin route
// gets the shared light dashboard shell with a persistent sidebar.
export default function AdminLayout({ children }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return children;
  }

  return (
    <div className="admin-light">
      <div className="admin-shell-with-sidebar">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
