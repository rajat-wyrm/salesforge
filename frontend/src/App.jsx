import { AuthProvider } from "./context/AuthContext";
import { Toaster as SonnerToaster } from "sonner";
import AppRouter from "./router/AppRouter";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
          <AppRouter />
          <SonnerToaster richColors position="top-right" />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
