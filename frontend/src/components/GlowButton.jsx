import { motion } from "framer-motion";

const variants = {
  primary:
    "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
  secondary:
    "border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
  ghost:
    "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800",
  danger:
    "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export default function GlowButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  onClick,
  type = "button",
  disabled = false,
  glowOnHover = true,
  ...props
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 overflow-hidden group";

  const Comp = href ? motion.a : motion.button;

  return (
    <Comp
      type={href ? undefined : type}
      href={href}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      {...props}
    >
      {glowOnHover && (
        <motion.span
          className="absolute inset-0 -z-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(139, 92, 246, 0.15), transparent 40%)",
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.span
        className="absolute inset-0 -z-10 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </Comp>
  );
}
