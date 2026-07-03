import { useTheme } from "@/context/ThemeContext";

export default function AnimatedBackground() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-colors duration-700 ${
          darkMode ? "bg-violet-900/15" : "bg-violet-300/20"
        }`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] transition-colors duration-700 ${
          darkMode ? "bg-blue-900/15" : "bg-blue-300/20"
        }`}
      />
      <div
        className={`absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] rounded-full blur-[100px] transition-colors duration-700 ${
          darkMode ? "bg-teal-900/10" : "bg-teal-300/15"
        }`}
      />
    </div>
  );
}
