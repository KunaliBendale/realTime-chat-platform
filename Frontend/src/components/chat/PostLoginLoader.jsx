import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle } from "lucide-react";

export function PostLoginLoader({ isVisible, userName }) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-app)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="flex flex-col items-center gap-6 px-8 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <motion.div
              className="relative grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-violet-500 shadow-2xl shadow-indigo-500/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <MessageCircle size={36} className="text-white" strokeWidth={1.75} />
            </motion.div>

            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Welcome back</p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                {userName ? `Hi, ${userName.split(" ")[0]}` : "Setting up your inbox"}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Syncing conversations and connecting in real time…
              </p>
            </div>

            <Loader2 size={28} className="animate-spin text-indigo-400" aria-label="Loading" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
