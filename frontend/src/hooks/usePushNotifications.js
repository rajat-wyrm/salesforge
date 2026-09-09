import { useEffect, useState, useRef } from "react";
import { getFirebaseMessaging, firebaseConfig } from "../lib/firebase";
import { toast } from "sonner";
import { pushService } from "../services";

// Module-level guards
let _subscribeInProgress = false;
let _subscribed = false;

export const usePushNotifications = (scrollThreshold = 0.7) => {
  const [token, setToken] = useState(null);
  const scrolledRef = useRef(false);

  // Set up Firebase foreground message listener.
  // NotificationBell/SSE handles the visible notification to avoid
  // duplicate popups.
  useEffect(() => {
    let unsubscribe = null;

    const setupForegroundMessaging = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const { onMessage } = await import("firebase/messaging");

      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
      });
    };

    setupForegroundMessaging();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const requestPermissionAndSubscribe = async () => {
    if (_subscribed || _subscribeInProgress) return;

    _subscribeInProgress = true;

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const messaging = await getFirebaseMessaging();

        if (!messaging) {
          return;
        }

        const { getToken } = await import("firebase/messaging");

        // Pass Firebase config to the service worker through the URL.
        const swUrl =
          `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}` +
          `&projectId=${firebaseConfig.projectId}` +
          `&messagingSenderId=${firebaseConfig.messagingSenderId}` +
          `&appId=${firebaseConfig.appId}` +
          `&authDomain=${firebaseConfig.authDomain}` +
          `&storageBucket=${firebaseConfig.storageBucket}`;

        const registration =
          await navigator.serviceWorker.register(swUrl);

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          setToken(currentToken);

          await pushService.subscribe(currentToken);

          console.log("Push token sent to backend successfully.");

          toast.success("Push notifications enabled.");

          _subscribed = true;
        }
      } else {
        toast.error("Permission denied for push notifications.");
      }
    } catch (error) {
      console.error(
        "Error subscribing to push notifications:",
        error
      );
    } finally {
      _subscribeInProgress = false;
    }
  };

  // Auto-subscribe on mount if permission is already granted.
  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      requestPermissionAndSubscribe();
    }
  }, []);

  // Trigger subscription when the user scrolls past the threshold.
  useEffect(() => {
    const handleScroll = () => {
      if (scrolledRef.current) return;

      const scrollTop =
        window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      const denominator = scrollHeight - clientHeight;

      if (denominator <= 0) return;

      const scrolledPercentage = scrollTop / denominator;

      if (scrolledPercentage >= scrollThreshold) {
        scrolledRef.current = true;

        if (
          Notification.permission === "default" ||
          Notification.permission === "granted"
        ) {
          requestPermissionAndSubscribe();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold]);

  return {
    requestPermissionAndSubscribe,
    token,
  };
};