import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import "./styles/global.css";
import { initializeTheme } from "./context/ThemeContext";
import reportWebVitals from "../reportWebVitals.js";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-200">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p>Loading...</p>
    </div>
  </div>
);
//console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);

initializeTheme();
console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

reportWebVitals();