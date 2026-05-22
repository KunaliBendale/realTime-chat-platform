import { motion } from "framer-motion";
import { useState } from "react";
import { API_BASE_URL } from "../../config/env";

export function GoogleAuthButton({ label = "Continue with Google" }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  return (
    <motion.a
      href={`${API_BASE_URL}/auth/google`}
      onClick={() => setIsRedirecting(true)}
      aria-busy={isRedirecting}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-indigo-400/40 hover:shadow-md"
    >
      <span className="grid size-6 place-items-center rounded-lg bg-white text-xs font-bold text-[#4285F4] shadow-sm">
        {isRedirecting ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        ) : (
          "G"
        )}
      </span>
      {isRedirecting ? "Redirecting to Google…" : label}
    </motion.a>
  );
}
