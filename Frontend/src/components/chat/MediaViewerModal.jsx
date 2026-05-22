import { AnimatePresence, motion } from "framer-motion";
import { Download, X, ZoomIn } from "lucide-react";
import { Button } from "../ui/Button";

export function MediaViewerModal({ media, onClose }) {
  return (
    <AnimatePresence>
      {media ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.figure
            className="relative z-10 max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl glass-elevated"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <ZoomIn size={16} />
                Media preview
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex"
                >
                  <Button variant="ghost" size="icon" aria-label="Download">
                    <Download size={18} />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X size={18} />
                </Button>
              </div>
            </div>

            <div className="flex max-h-[calc(90vh-56px)] items-center justify-center bg-black/40 p-2">
              <img
                src={media.url}
                alt={media.alt || "Shared media"}
                className="max-h-[calc(90vh-80px)] max-w-full rounded-2xl object-contain"
              />
            </div>
          </motion.figure>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
