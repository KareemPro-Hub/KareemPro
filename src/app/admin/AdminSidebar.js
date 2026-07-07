"use client";

import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", icon: "🏠", label: "الرئيسية" },
  { href: "/admin/clients/new", icon: "➕", label: "عميل جديد" },
  { href: "/admin/content", icon: "🗂️", label: "المحتوى العام" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <a href="/admin" className="admin-sidebar-brand">
        <img src="/logo-transparent.png" alt="Kareem Pro" />
        <span>KAREEM PRO</span>
      </a>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {NAV.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`admin-nav-link${isActive ? " active" : ""}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-outline btn-sm" style={{ width: "100%" }}>
            خروج
          </button>
        </form>
      </div>
    </aside>
  );
}
