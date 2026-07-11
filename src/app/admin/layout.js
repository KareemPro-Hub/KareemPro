"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

// /admin/login keeps its own dark cinematic design (glass card + glow blobs)
// and must NOT get the dashboard shell — a shared wrapper here would force
// it onto every route including login, so it's skipped by pathname.
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return children;
  }
  return <AdminShell>{children}</AdminShell>;
}
