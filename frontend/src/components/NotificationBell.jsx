import React, { useEffect, useState } from "react";
import { notificationService } from "@/services";
import { openEventStream } from "@/lib/api";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NotificationBell = () => {
  const { tokenStore } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await notificationService.list({ limit: 20 });
        if (mounted) {
          setItems(data?.data || []);
          setUnread(data?.summary?.unreadCount || 0);
        }
      } catch {}
    };
    load();
    const stream = openEventStream("/sse/stream", {
      onEvent: (evt) => {
        if (evt === "notification.new" || evt === "notifications.read_all") load();
        if (["LEAD_CREATED", "LEAD_UPDATED", "DEAL_CREATED", "DEAL_UPDATED", "PAYMENT_SUCCEEDED", "PAYMENT_FAILED", "USER_INVITED", "USER_JOINED", "INTEGRATION_SYNCED"].includes(evt)) {
          load();
        }
      },
    });
    const id = setInterval(load, 60_000);
    return () => { mounted = false; stream.close(); clearInterval(id); };
  }, []);

  const markAll = async () => {
    try { await notificationService.markAllRead(); setUnread(0); setItems((p) => p.map((n) => ({ ...n, is_read: true }))); }
    catch {}
  };

  const markOne = async (id) => {
    try { await notificationService.markRead(id); setUnread((u) => Math.max(0, u - 1)); setItems((p) => p.map((n) => n.id === id ? { ...n, is_read: true } : n)); }
    catch {}
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-800">
            <span>Notifications</span>
            <button onClick={markAll} className="text-xs font-normal text-teal-600 hover:underline">Mark all read</button>
          </div>
          <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</li>
            ) : items.map((n) => (
              <li key={n.id} className={`flex items-start gap-2 px-4 py-3 text-sm ${n.is_read ? "" : "bg-teal-50/50 dark:bg-teal-900/10"}`}>
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.is_read ? "transparent" : "#14b8a6" }} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{n.message}</p>
                  <p className="text-xs text-gray-500">{n.type} · {new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markOne(n.id)} className="text-xs text-teal-600 hover:underline">Read</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
