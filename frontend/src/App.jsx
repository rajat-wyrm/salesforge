import { AuthProvider } from "./context/AuthContext";
import { Toaster as SonnerToaster } from "sonner";
import AppRouter from "./router/AppRouter";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
            <AppRouter />
            <SonnerToaster richColors position="top-right" />
          </div>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
