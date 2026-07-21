import { useEffect, useState, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, firebaseConfig } from '../lib/firebase';
import { toast } from 'sonner';
import { api } from '../lib/api';

export const usePushNotifications = (scrollThreshold = 0.7) => {
  const [token, setToken] = useState(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    let unsubscribe = null;

    const setupForegroundMessaging = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);
        toast(payload.notification?.title || "New Notification", {
          description: payload.notification?.body || "You have a new message",
        });
      });
    };

    setupForegroundMessaging();

    // Check permission immediately instead of waiting for scroll
    if ("Notification" in window) {
      if (Notification.permission === 'granted' || Notification.permission === 'default') {
        // We will call requestPermissionAndSubscribe slightly later because it relies on the function below
        // Actually, we can't call it here directly because requestPermissionAndSubscribe is defined below.
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const requestPermissionAndSubscribe = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        
        // Pass the config as URL params to the SW so we don't hardcode it in public/
        const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&projectId=${firebaseConfig.projectId}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}&authDomain=${firebaseConfig.authDomain}&storageBucket=${firebaseConfig.storageBucket}`;
        
        const registration = await navigator.serviceWorker.register(swUrl);
        
        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          setToken(currentToken);
          // Send token to backend
          await api.post('/push/subscribe', { token: currentToken });
          console.log("Push token sent to backend successfully.");
        }
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      requestPermissionAndSubscribe();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (scrolledRef.current) return; // Already triggered

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      const scrolledPercentage = scrollTop / (scrollHeight - clientHeight);
      
      if (scrolledPercentage >= scrollThreshold) {
        scrolledRef.current = true;
        // Check if we haven't asked or if it's default
        if (Notification.permission === 'default') {
          requestPermissionAndSubscribe();
        } else if (Notification.permission === 'granted') {
          // If already granted, just make sure we have the token sent
          requestPermissionAndSubscribe();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  return { requestPermissionAndSubscribe, token };
};
