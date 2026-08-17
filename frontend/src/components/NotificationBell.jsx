import React, { useEffect, useState } from "react";
import { notificationService } from "@/services";
import { openEventStream } from "@/lib/api";
import { Bell, Trash2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const NotificationBell = () => {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  usePushNotifications();

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
        if (
          evt === "notification.new" ||
          evt === "notifications.read_all"
        ) {
          load();
        }

        if (
          [
            "LEAD_CREATED",
            "LEAD_UPDATED",
            "DEAL_CREATED",
            "DEAL_UPDATED",
            "PAYMENT_SUCCEEDED",
            "PAYMENT_FAILED",
            "USER_INVITED",
            "USER_JOINED",
            "INTEGRATION_SYNCED",
          ].includes(evt)
        ) {
          load();
        }
      },
    });

    const id = setInterval(load, 60_000);

    return () => {
      mounted = false;
      stream.close();
      clearInterval(id);
    };
  }, []);

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      setUnread(0);
      setItems((p) =>
        p.map((n) => ({
          ...n,
          is_read: true,
        }))
      );
    } catch {}
  };

  const markOne = async (id) => {
    try {
      await notificationService.markRead(id);

      setUnread((u) => Math.max(0, u - 1));

      setItems((p) =>
        p.map((n) =>
          n.id === id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch {}
  };

  const deleteAll = async () => {
    try {
      await notificationService.removeAll();
      setItems([]);
      setUnread(0);
    } catch {}
  };

  const deleteOne = async (id, isRead) => {
    try {
      await notificationService.remove(id);

      setItems((p) => p.filter((n) => n.id !== id));

      if (!isRead) {
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch {}
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
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:w-96">
          <div className="flex flex-col border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
              <span>Notifications</span>

              <div className="flex items-center gap-3">
                <button
                  onClick={markAll}
                  className="text-xs font-normal text-teal-600 hover:underline"
                >
                  Mark all read
                </button>

                <button
                  onClick={deleteAll}
                  className="text-xs font-normal text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>

          <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet.
              </li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`group flex items-start gap-2 px-4 py-3 text-sm ${
                    n.is_read
                      ? ""
                      : "bg-teal-50/50 dark:bg-teal-900/10"
                  }`}
                >
                  <div
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: n.is_read
                        ? "transparent"
                        : "#14b8a6",
                    }}
                  />

                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {n.message}
                    </p>

                    <p className="text-xs text-gray-500">
                      {n.type} ·{" "}
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    {!n.is_read && (
                      <button
                        onClick={() => markOne(n.id)}
                        className="text-xs text-teal-600 hover:underline"
                      >
                        Read
                      </button>
                    )}

                    <button
                      onClick={() => deleteOne(n.id, n.is_read)}
                      className="text-gray-400 transition-colors hover:text-red-500"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;