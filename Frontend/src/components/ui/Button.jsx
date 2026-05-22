import { motion } from "framer-motion";

const variants = {
  primary:
    "bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
  secondary:
    "glass-panel text-[var(--text-primary)] hover:border-indigo-400/30",
  ghost: "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]",
  danger: "bg-red-500/90 text-white hover:bg-red-600",
};

const sizes = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-sm gap-2",
  icon: "size-10 p-0",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      whileHover={disabled || isLoading ? undefined : { scale: 1.02 }}
      whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
