"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  clearAllAdminNotifications,
} from "./actions";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isPending, startTransition] = useTransition();
  const wrapRef = useRef(null);

  const unread = notifications.filter((n) => !n.read_at);

  function refresh() {
    getAdminNotifications()
      .then((rows) => setNotifications(rows))
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleItemClick(n) {
    if (!n.read_at) {
      startTransition(async () => {
        try {
          await markAdminNotificationRead(n.id);
          refresh();
        } catch {}
      });
    }
  }

  function handleMarkAll() {
    startTransition(async () => {
      try {
        await markAllAdminNotificationsRead();
        refresh();
      } catch {}
    });
  }

  function handleClearAll() {
    if (!window.confirm("متأكد إنك عايز تمسح كل الإشعارات نهائيًا ؟")) return;
    startTransition(async () => {
      try {
        await clearAllAdminNotifications();
        refresh();
      } catch {}
    });
  }

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="round notification-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unread.length > 0 && <span className="notif-bell-badge">{unread.length > 9 ? "9+" : unread.length}</span>}
      </button>

      {open && (
        <div className="notif-bell-dropdown">
          <div className="notif-bell-head">
            <span>الإشعارات</span>
            <div className="notif-bell-head-actions">
              {unread.length > 0 && (
                <button type="button" onClick={handleMarkAll} disabled={isPending}>
                  تحديد الكل كمقروء
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" className="notif-bell-clear" onClick={handleClearAll} disabled={isPending}>
                  مسح الكل
                </button>
              )}
            </div>
          </div>
          <div className="notif-bell-list">
            {notifications.length === 0 && <p className="notif-bell-empty">لا يوجد إشعارات بعد.</p>}
            {notifications.map((n) => (
              <a
                key={n.id}
                href={n.link || "#"}
                className={`notif-bell-item${!n.read_at ? " unread" : ""}`}
                onClick={() => handleItemClick(n)}
              >
                <span className="notif-bell-dot" />
                <div>
                  <div className="notif-bell-message">{n.message}</div>
                  <div className="notif-bell-time">{timeAgo(n.created_at)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
