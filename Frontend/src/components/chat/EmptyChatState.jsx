import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

export function EmptyChatState({ onStartChat }) {
  return (
    <motion.section
      className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="gradient-border relative mb-8 grid size-24 place-items-center rounded-[2rem] glass-elevated"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="grid size-[4.5rem] place-items-center rounded-[1.4rem] bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-violet-500/20">
          <MessageCircle size={36} className="text-indigo-400" strokeWidth={1.5} />
        </div>
        <Sparkles
          size={16}
          className="absolute -right-1 -top-1 text-amber-400"
          aria-hidden="true"
        />
      </motion.div>

      <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
        Your conversations live here
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        Pick a chat from the sidebar or start a new conversation. Messages sync in real time with
        delivery and typing indicators.
      </p>

      {onStartChat ? (
        <Button className="mt-8" onClick={onStartChat}>
          Start a conversation
        </Button>
      ) : null}
    </motion.section>
  );
}
