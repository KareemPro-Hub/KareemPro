"use client";

import PlatformIcon from "@/app/components/PlatformIcon";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminNotificationBell from "./AdminNotificationBell";
import PasskeySetup from "./PasskeySetup";
import TeamIcon from "@/app/components/TeamIcon";
import WalletIcon from "@/app/components/WalletIcon";
import DeliveryIcon from "@/app/components/DeliveryIcon";
import TargetIcon from "@/app/components/TargetIcon";
import ProjectsIcon from "@/app/components/ProjectsIcon";
import ClientsIcon from "@/app/components/ClientsIcon";
import "./kp-dashboard.css";

const QUICK_ACTIONS = [
  { href: "/admin/projects/new", label: "مشروع جديد", icon: "briefcase", desc: "ابدأ مساحة عمل" },
  { href: "/admin/clients/new", label: "عميل جديد", icon: "user", desc: "أضف بيانات عميل" },
  { href: "/admin/pipeline", label: "عرض سعر", icon: "document-signed", desc: "أنشئ عرضًا احترافيًا" },
  { href: "/admin/wallet", label: "فاتورة جديدة", icon: "file-invoice", desc: "سجّل مستحقاتك" },
  { href: "/admin/team", label: "مهمة لفريق العمل", icon: "users-alt", desc: "كلّف عضو فريق بمهمة" },
  { href: "/admin/delivery", label: "موعد جديد", icon: "calendar", desc: "جدول تسليمًا" },
];

const NAV_GROUPS = [
  {
    label: "مساحة العمل",
    items: [
      { href: "/admin", label: "نظرة عامة", icon: "binocular" },
      { href: "/admin/pipeline", label: "تخطيط وإدارة", iconComponent: TargetIcon },
      { href: "/admin/projects", label: "المشاريع", iconComponent: ProjectsIcon },
      { href: "/admin/clients", label: "أصحاب المشاريع", iconComponent: ClientsIcon },
      { href: "/admin/team", label: "فريق العمل", iconComponent: TeamIcon },
    ],
  },
  {
    label: "الإدارة والأداء",
    items: [
      { href: "/admin/delivery", label: "مركز التسليم", iconComponent: DeliveryIcon },
      { href: "/admin/wallet", label: "المحفظة", iconComponent: WalletIcon },
      { href: "/admin/payments", label: "عمليات Xpay", iconComponent: WalletIcon },
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
            <span><svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#user-pen"></use></svg></span> إجراء جديد
          </button>

          <nav>
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                {/* Group headings ("مساحة العمل" / "الإدارة والأداء") are
                    intentionally not rendered — the grouping still controls
                    order and spacing, the labels just added visual noise. */}
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    className={`nav-link${isActive(pathname, item.href) ? " active" : ""}`}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="ico nav-image-icon">
                      {item.iconComponent ? <item.iconComponent size="1.4em" /> : <PlatformIcon name="eye" size="1.4em" />}
                    </span>
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <PasskeySetup />

          <div className="sidebar-foot compact-account">
            <form action="/auth/signout" method="post">
              <button className="account-logout" type="submit" aria-label="تسجيل الخروج">
                <svg aria-hidden="true" className="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><use href="/icons/ui.svg#sign-out-alt"></use></svg>
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
              <svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#menu-burger"></use></svg>
            </button>
            <div className="welcome">
              <h1>صباح التوفيق يا كريم</h1>
              <p>رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي</p>
            </div>
            <div className="header-actions">
              <form className="search" onSubmit={handleSearch}>
                <span><svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#search"></use></svg></span>
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
          <button className="modal-close" type="button" aria-label="إغلاق" onClick={() => setModalOpen(false)}>
            <svg className="ui-icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="/icons/ui.svg#angle-small-down"></use></svg>
          </button>
          <span className="overline">اختصار سريع</span>
          <h2>ماذا تريد أن تنشئ ؟</h2>
          <div className="action-grid">
            {QUICK_ACTIONS.map((a) => (
              <a key={a.href} href={a.href}>
                <i><PlatformIcon name={a.icon} /></i>
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
