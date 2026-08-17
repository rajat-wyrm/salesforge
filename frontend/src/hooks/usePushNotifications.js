import { useEffect, useState, useRef } from 'react';
import { getFirebaseMessaging, firebaseConfig } from '../lib/firebase';
import { toast } from 'sonner';
import { pushService } from '../services';

// Module-level guard
let _subscribeInProgress = false;
let _subscribed = false;
export const usePushNotifications = (scrollThreshold = 0.7) => {
  const [token, setToken] = useState(null);
  const scrolledRef = useRef(false);

  // Set up Firebase foreground message listener (safe to call in every instance)
  useEffect(() => {
    let unsubscribe = null;

    const setupForegroundMessaging = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      // Dynamic import to avoid static + dynamic conflict
      const { onMessage } = await import('firebase/messaging');
      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        // OS notification and toast are handled by NotificationBell SSE stream
        // to avoid double-popups.

      });
    };

    setupForegroundMessaging();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);


  const requestPermissionAndSubscribe = async () => {
    // Deduplicate: if already subscribed or a subscribe is in progress, skip.
    if (_subscribed || _subscribeInProgress) return;
    _subscribeInProgress = true;

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const messaging = await getFirebaseMessaging();

        if (!messaging) {
          _subscribeInProgress = false;
          return;
        }

        // Dynamic import to avoid static + dynamic conflict
        const { getToken } = await import('firebase/messaging');

        // Pass the config as URL params to the SW so we don't hardcode it in public/
        const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&projectId=${firebaseConfig.projectId}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}&authDomain=${firebaseConfig.authDomain}&storageBucket=${firebaseConfig.storageBucket}`;

        const registration = await navigator.serviceWorker.register(swUrl);

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          setToken(currentToken);
          await pushService.subscribe(currentToken);
          console.log("Push token sent to backend successfully.");

          // Toast fires exactly once — module-level flag prevents re-entry
          toast.success("Push notifications enabled.");
          _subscribed = true;
        }
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    } finally {
      _subscribeInProgress = false;
    }
  };



  // Auto-subscribe on mount if permission is already granted.
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      requestPermissionAndSubscribe();
    }
  }, []);

  // Trigger subscribe when user scrolls past threshold.
  useEffect(() => {
    const handleScroll = () => {
      if (scrolledRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrolledPercentage = scrollTop / (scrollHeight - clientHeight);

      if (scrolledPercentage >= scrollThreshold) {
        scrolledRef.current = true;

        if (Notification.permission === 'default' || Notification.permission === 'granted') {
          requestPermissionAndSubscribe();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  return { requestPermissionAndSubscribe, token };
};
