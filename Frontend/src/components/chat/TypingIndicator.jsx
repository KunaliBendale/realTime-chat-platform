import { motion } from "framer-motion";

export function TypingIndicator({ name }) {
  return (
    <motion.div
      className="flex items-end gap-2 px-4 py-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
    >
      <div className="rounded-3xl rounded-bl-md border border-[var(--border-subtle)] bg-[var(--bg-bubble-other)] px-4 py-3 shadow-sm">
        <p className="mb-1.5 text-[11px] font-medium text-[var(--text-muted)]">
          {name ? `${name} is typing` : "Typing"}
        </p>
        <div className="flex items-center gap-1">
          <span className="typing-dot size-2 rounded-full bg-indigo-400" />
          <span className="typing-dot size-2 rounded-full bg-cyan-400" />
          <span className="typing-dot size-2 rounded-full bg-violet-400" />
        </div>
      </div>
    </motion.div>
  );
}
