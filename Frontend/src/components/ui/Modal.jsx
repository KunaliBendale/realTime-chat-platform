import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./Button";

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  icon: Icon,
  size = "md",
  bodyClassName = "",
  panelClassName = "",
  scrollable = true,
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const bodyScrollClass = scrollable
    ? "custom-scrollbar overflow-y-auto"
    : "overflow-y-auto sm:overflow-visible";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl glass-elevated sm:max-h-[88vh] sm:rounded-3xl ${sizeClass} ${panelClassName}`}
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
              <motion.div
                className="flex min-w-0 items-start gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {Icon ? (
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-violet-500/20 text-indigo-400 ring-1 ring-indigo-400/20">
                    <Icon size={20} />
                  </span>
                ) : null}
                <div className="min-w-0">
                  <h2
                    id="modal-title"
                    className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
                  >
                    {title}
                  </h2>
                  {description ? (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {description}
                    </p>
                  ) : null}
                </div>
              </motion.div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X size={18} />
              </Button>
            </header>

            <div className={`min-h-0 flex-1 px-5 py-5 sm:px-6 ${bodyScrollClass} ${bodyClassName}`}>
              {children}
            </div>

            {footer ? (
              <footer className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-4 sm:px-6">
                {footer}
              </footer>
            ) : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
