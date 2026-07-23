import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ENHANCEMENT_TONES } from "../../../lib/messageEnhancement";

export function ToneSelector({
  open,
  activeTone,
  disabled,
  isLoading,
  onClose,
  onSelectTone,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (isLoading) return;
      if (!panelRef.current?.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          className="fixed inset-x-3 bottom-24 z-50 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-float)] backdrop-blur-xl sm:absolute sm:bottom-12 sm:left-0 sm:right-auto sm:w-64"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          role="menu"
          aria-label="Choose enhancement tone"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="px-3 py-2">
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              Enhance tone
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 sm:grid-cols-1">
            {ENHANCEMENT_TONES.map((tone) => {
              const toneLoading = isLoading && activeTone === tone.id;

              return (
                <button
                  key={tone.id}
                  type="button"
                  role="menuitem"
                  disabled={disabled || isLoading}
                  onClick={() => onSelectTone(tone.id)}
                  className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-white/10 focus-visible:bg-white/10 disabled:opacity-50"
                >
                  {tone.label}
                  {toneLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
