import { AnimatePresence, motion } from "framer-motion";

import { Sparkles, X } from "lucide-react";

import { useMemo } from "react";

import { getDefaultSmartReplies } from "../../lib/defaultSmartReplies";

import { isValidReplySuggestion } from "../../lib/suggestionValidation";

import { Button } from "../ui/Button";

import { Skeleton } from "../ui/Skeleton";



export function SmartReplySuggestions({

  suggestions = [],

  status,

  visible,

  isLoading,

  onSelect,

  onDismiss,

}) {

  const cleanSuggestions = useMemo(() => {

    const filtered = suggestions.filter((item) => isValidReplySuggestion(item)).slice(0, 3);

    return filtered.length > 0 ? filtered : getDefaultSmartReplies();

  }, [suggestions]);



  if (!visible) return null;



  const showSkeleton = isLoading;



  return (

    <AnimatePresence mode="wait">

      <motion.div

        key={`${status}-${cleanSuggestions.length}`}

        className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 px-3 py-2.5 backdrop-blur-xl sm:px-4"

        initial={{ opacity: 0, y: 10 }}

        animate={{ opacity: 1, y: 0 }}

        exit={{ opacity: 0, y: 8 }}

        transition={{ duration: 0.22, ease: "easeOut" }}

        role="region"

        aria-label="Smart reply suggestions"

        aria-busy={isLoading}

      >

        <div className="mx-auto max-w-3xl">

          <div className="mb-2 flex items-center justify-between gap-2">

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">

              <Sparkles size={14} className="text-violet-400" />

              <span>Smart replies</span>

              {status === "cached" ? (

                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">

                  cached

                </span>

              ) : null}

            </div>

            <Button

              variant="ghost"

              size="icon"

              className="size-8"

              onClick={onDismiss}

              aria-label="Dismiss suggestions"

            >

              <X size={14} />

            </Button>

          </div>



          {showSkeleton ? (

            <div className="flex gap-2 overflow-x-auto pb-1" aria-hidden="true">

              {[1, 2, 3].map((item) => (

                <Skeleton key={item} className="h-9 w-28 shrink-0 rounded-full" />

              ))}

            </div>

          ) : (

            <motion.div

              className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar"

              initial="hidden"

              animate="visible"

              variants={{

                hidden: {},

                visible: { transition: { staggerChildren: 0.06 } },

              }}

            >

              {cleanSuggestions.map((suggestion, index) => (

                <motion.button

                  key={`${suggestion}-${index}`}

                  type="button"

                  variants={{

                    hidden: { opacity: 0, y: 8, scale: 0.96 },

                    visible: { opacity: 1, y: 0, scale: 1 },

                  }}

                  whileHover={{ scale: 1.03 }}

                  whileTap={{ scale: 0.98 }}

                  onClick={() => onSelect(suggestion)}

                  className="shrink-0 rounded-full border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-sm transition hover:border-indigo-400/50 hover:shadow-md"

                >

                  {suggestion}

                </motion.button>

              ))}

            </motion.div>

          )}

        </div>

      </motion.div>

    </AnimatePresence>

  );

}

