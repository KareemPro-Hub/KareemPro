"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNotificationBell from "./AdminNotificationBell";
import TeamIcon from "@/app/components/TeamIcon";
import WalletIcon from "@/app/components/WalletIcon";
import "./kp-dashboard.css";

const QUICK_ACTIONS = [
  { href: "/admin/projects/new", label: "مشروع جديد", desc: "ابدأ مساحة عمل" },
  { href: "/admin/clients/new", label: "عميل جديد", desc: "أضف بيانات عميل" },
  { href: "/admin/pipeline", label: "عرض سعر", desc: "أنشئ عرضًا احترافيًا" },
  { href: "/admin/wallet", label: "فاتورة جديدة", desc: "سجّل مستحقاتك" },
  { href: "/admin/team", label: "مهمة لفريق العمل", desc: "كلّف عضو فريق بمهمة" },
  { href: "/admin/delivery", label: "موعد جديد", desc: "جدول تسليمًا" },
];

const NAV_GROUPS = [
  {
    label: "مساحة العمل",
    items: [
      { href: "/admin", label: "نظرة عامة", icon: "binocular" },
      { href: "/admin/pipeline", label: "تخطيط وإدارة", icon: "target" },
      { href: "/admin/projects", label: "المشاريع", icon: "project-management" },
      { href: "/admin/clients", label: "أصحاب المشاريع", icon: "customer" },
      { href: "/admin/team", label: "فريق العمل", iconComponent: TeamIcon },
    ],
  },
  {
    label: "الإدارة والأداء",
    items: [
      { href: "/admin/delivery", label: "مركز التسليم", icon: "closure" },
      { href: "/admin/wallet", label: "المحفظة", iconComponent: WalletIcon },
    ],
  },
];

function isActive(pathname, href) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/admin/clients?q=${encodeURIComponent(q)}` : "/admin/clients");
    setSidebarOpen(false);
  }

  return (
    <div className="kp-dashboard">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="shell">
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <a className="brand" href="/admin">
            <div className="brand-mark">
              <img src="/admin-ui/icons/kareem-pro-logo.png" alt="Kareem Pro" />
            </div>
            <div>
              <b>
                Kareem <i>Pro</i>
              </b>
              <span>مدير المنصة</span>
            </div>
          </a>

          <button className="new-btn" type="button" onClick={() => setModalOpen(true)}>
            <span>＋</span> إجراء جديد
          </button>

          <nav>
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p>{group.label}</p>
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    className={`nav-link${isActive(pathname, item.href) ? " active" : ""}`}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="ico nav-image-icon">
                      {item.iconComponent ? <item.iconComponent size="1.4em" /> : <img src={`/admin-ui/icons/${item.icon}.png`} alt="" />}
                    </span>
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-foot compact-account">
            <form action="/auth/signout" method="post">
              <button className="account-logout" type="submit" aria-label="تسجيل الخروج">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 17l5-5-5-5M15 12H3M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
                </svg>
              </button>
            </form>
            <div className="account-copy">
              <b>كريم عبد الصادق</b>
              <span>مدير المنصة</span>
            </div>
            <div className="avatar">
              <img src="/admin-ui/icons/kareem-avatar.jpg" alt="صورة كريم" />
            </div>
          </div>
        </aside>

        <main>
          <header>
            <button className="mobile-menu" onClick={() => setSidebarOpen((v) => !v)} aria-label="القائمة">
              ☰
            </button>
            <div className="welcome">
              <h1>صباح التوفيق يا كريم</h1>
              <p>رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي</p>
            </div>
            <div className="header-actions">
              <form className="search" onSubmit={handleSearch}>
                <span>⌕</span>
                <input
                placeholder="ابحث عن مشروع أو عميل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
              <AdminNotificationBell />
              <a className="mini-avatar" href="/admin" aria-label="حساب كريم">
                <img src="/admin-ui/icons/kareem-avatar.jpg" alt="صورة كريم الشخصية" />
              </a>
            </div>
          </header>

          {children}
        </main>
      </div>

      <div className={`modal-wrap${modalOpen ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <div className="modal">
          <button className="modal-close" type="button" onClick={() => setModalOpen(false)}>
            ×
          </button>
          <span className="overline">اختصار سريع</span>
          <h2>ماذا تريد أن تنشئ ؟</h2>
          <div className="action-grid">
            {QUICK_ACTIONS.map((a) => (
              <a key={a.href} href={a.href}>
                <i>＋</i>
                <b>{a.label}</b>
                <span>{a.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
