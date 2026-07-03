import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((p) => !p)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/80 bg-white/50 text-gray-600 shadow-sm backdrop-blur-sm transition hover:bg-gray-100 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1 text-[10px] font-semibold text-white shadow-lg shadow-red-500/30"
          >
            {unread > 99 ? "99+" : unread}
          </motion.span>
        )}
      </motion.button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-gray-800/50 dark:bg-gray-900/95"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm font-semibold dark:border-gray-800">
            <span>Notifications</span>
            <button onClick={markAll} className="text-xs font-normal text-teal-600 hover:text-teal-500 transition-colors">Mark all read</button>
          </div>
          <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</li>
            ) : items.map((n) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 px-4 py-3 text-sm transition-colors ${n.is_read ? "" : "bg-gradient-to-r from-teal-50/80 to-transparent dark:from-teal-900/20 dark:to-transparent"}`}
              >
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-transparent" : "bg-teal-500 shadow-lg shadow-teal-500/50"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.type} · {new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markOne(n.id)} className="text-xs font-medium text-teal-600 hover:text-teal-500 shrink-0">Read</button>
                )}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationBell;
