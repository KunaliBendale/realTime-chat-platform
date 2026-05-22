import { motion } from "framer-motion";
import { MessageCircle, Shield, Zap } from "lucide-react";

const features = [
  { icon: Zap, text: "Real-time messaging with typing & presence" },
  { icon: Shield, text: "Secure JWT sessions & protected routes" },
  { icon: MessageCircle, text: "Direct chats, groups & saved contacts" },
];

export function AuthShell({ title, subtitle, children }) {
  return (
    <main className="app-shell relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        className="pointer-events-none absolute -left-32 top-0 size-96 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-0 size-[28rem] rounded-full bg-violet-500/20 blur-3xl"
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <motion.section
          className="gradient-border grid w-full overflow-hidden rounded-[2rem] glass-elevated md:grid-cols-[1fr_1.05fr]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 text-white md:flex">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                Pulse Chat
              </div>
              <h1 className="mt-8 max-w-sm text-4xl font-bold leading-tight tracking-tight">
                Conversations that feel instant.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                A premium real-time messenger built for clarity, speed, and beautiful everyday
                communication.
              </p>
            </div>

            <ul className="relative space-y-4">
              {features.map(({ icon: Icon, text }, index) => (
                <motion.li
                  key={text}
                  className="flex items-start gap-3 text-sm text-slate-300"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white/10 text-cyan-300">
                    <Icon size={16} />
                  </span>
                  {text}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex min-h-[min(720px,90vh)] items-center justify-center px-5 py-10 sm:px-10">
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
            >
              <div className="mb-8 md:hidden">
                <p className="gradient-text text-sm font-bold uppercase tracking-[0.2em]">
                  Pulse
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {subtitle}
                </p>
              </div>

              {children}
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
