import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Send, Smile, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { SmartReplySuggestions } from "./SmartReplySuggestions";

export function MessageInput({
  chat,
  onPrepareOptimisticMessage,
  onSendMessage,
  onTyping,
  onStopTyping,
  smartReplies,
}) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [hideSuggestionsWhileTyping, setHideSuggestionsWhileTyping] = useState(false);

  const canSend = message.trim() || image.trim();

  useEffect(() => {
    if (!message.trim()) {
      setHideSuggestionsWhileTyping(false);
    }
  }, [message]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;

    const optimisticMessage = onPrepareOptimisticMessage({
      chatId: chat.id,
      content: message.trim(),
      image: image.trim() || null,
    });

    onSendMessage({
      chat,
      content: message.trim(),
      image: image.trim() || null,
      clientTempId: optimisticMessage.id,
    });

    setMessage("");
    setImage("");
    setShowImageField(false);
    setHideSuggestionsWhileTyping(true);
    onStopTyping(chat);
    smartReplies?.dismiss?.();
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessage(value);

    if (value.trim()) {
      setHideSuggestionsWhileTyping(true);
      onTyping(chat);
    } else {
      setHideSuggestionsWhileTyping(false);
      onStopTyping(chat);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setMessage(suggestion);
    setHideSuggestionsWhileTyping(true);
    smartReplies?.dismiss?.();
    onStopTyping(chat);
  };

  const showSmartReplies =
    smartReplies?.visible && !hideSuggestionsWhileTyping && !canSend;

  return (
    <div className="shrink-0">
      {showSmartReplies ? (
        <SmartReplySuggestions
          suggestions={smartReplies.suggestions}
          status={smartReplies.status}
          visible={smartReplies.visible}
          isLoading={smartReplies.isLoading}
          onSelect={handleSelectSuggestion}
          onDismiss={smartReplies.dismiss}
        />
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-3 backdrop-blur-xl sm:px-4"
      >
        <AnimatePresence>
          {showImageField ? (
            <motion.div
              className="mx-auto mb-3 flex max-w-3xl items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ImagePlus size={16} className="shrink-0 text-[var(--text-muted)]" />
              <input
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="Paste image URL"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageField(false);
                  setImage("");
                }}
                className="grid size-8 place-items-center rounded-xl text-[var(--text-muted)] hover:bg-white/10"
                aria-label="Remove attachment"
              >
                <X size={16} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="flex shrink-0 gap-1 pb-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowImageField((current) => !current)}
              aria-label="Attach image"
            >
              <ImagePlus size={20} />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Emoji">
              <Smile size={20} />
            </Button>
          </div>

          <label className="min-w-0 flex-1">
            <span className="sr-only">Message</span>
            <textarea
              rows={1}
              value={message}
              onChange={handleMessageChange}
              onBlur={() => onStopTyping(chat)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder="Type a message"
              className="max-h-32 min-h-11 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="mb-0.5 shrink-0 rounded-2xl"
            aria-label="Send message"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
}
