import { ModalProvider } from "@/context/ModalContext";
import { useTheme } from "../../context/ThemeContext";
import ModalManager from "./ModalManager";
import Navbar from "./Navbar";
import Pricing from "./Pricing";
import UseCases from "./UseCases";
import CTA from "./CTA";
import Footer from "./Footer";
import HowItWorks from "./HowItWorks";
import Features from "./Features";
import Hero from "./Hero";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function LandingPage() {
  const { Theme } = useTheme();
  const darkMode = Theme === "dark";

  return (
    <div
      className={`w-full min-h-screen antialiased transition-colors duration-500 ${
        darkMode ? "bg-slate-950 text-gray-100" : "bg-white text-gray-900"
      }`}
    >
      <AnimatedBackground />
      <ModalProvider>
        <Navbar />
        <ChatBotButton />

        <main className="pt-16">
          <Hero />
          <Features />
          <HowItWorks />
          <UseCases />
          <Pricing />
          <CTA />
        </main>

        <Footer />
        <ModalManager />
      </ModalProvider>
    </div>
  );
}

function ChatBotButton() {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-violet-500/30 to-purple-600/30 blur-xl animate-glow-pulse" />
      <button
        className="relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-600 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Open Chatbot"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 border-2 border-white animate-pulse" />
      </button>
    </div>
  );
}
