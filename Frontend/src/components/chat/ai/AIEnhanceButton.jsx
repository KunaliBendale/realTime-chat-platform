import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { canEnhanceMessage } from "../../../lib/messageEnhancement";
import { Button } from "../../ui/Button";
import { ToneSelector } from "./ToneSelector";

export function AIEnhanceButton({
  activeTone,
  disabled,
  isEnhancing,
  message,
  onSelectTone,
  status,
}) {
  const [open, setOpen] = useState(false);
  const canEnhance = canEnhanceMessage(message);
  const isDisabled = disabled || isEnhancing || !canEnhance;
  const showSuccess = status === "success";

  const closeSelector = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelectTone = async (tone) => {
    await onSelectTone(tone);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="group relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isDisabled}
          onClick={() => setOpen((current) => !current)}
          aria-label="Enhance Message"
          aria-haspopup="menu"
          aria-expanded={open}
          className="relative overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isEnhancing ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 size={19} className="animate-spin" />
              </motion.span>
            ) : showSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-emerald-400"
              >
                <Check size={19} />
              </motion.span>
            ) : (
              <motion.span
                key="sparkles"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[var(--text-muted)] transition group-hover:text-[var(--text-primary)]"
              >
                <Sparkles size={19} />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-[var(--shadow-soft)] transition group-hover:opacity-100 group-focus-within:opacity-100 sm:block">
          Enhance Message
        </span>
      </div>

      <ToneSelector
        open={open}
        activeTone={activeTone}
        disabled={disabled || !canEnhance}
        isLoading={isEnhancing}
        onClose={closeSelector}
        onSelectTone={handleSelectTone}
      />
    </div>
  );
}
