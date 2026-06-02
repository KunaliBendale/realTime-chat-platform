import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMessageEnhancement } from "../../hooks/useMessageEnhancement";
import { readImageAsDataUrl } from "../../lib/imagePayload";
import { Button } from "../ui/Button";
import { AIEnhanceButton } from "./ai/AIEnhanceButton";
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [hideSuggestionsWhileTyping, setHideSuggestionsWhileTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messageEnhancement = useMessageEnhancement();

  const canSend = Boolean(message.trim() || selectedImage?.dataUrl) && !isReadingImage;

  useEffect(() => {
    return () => {
      if (selectedImage?.previewUrl) {
        URL.revokeObjectURL(selectedImage.previewUrl);
      }
    };
  }, [selectedImage?.previewUrl]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;

    const optimisticMessage = onPrepareOptimisticMessage({
      chatId: chat.id,
      content: message.trim(),
      image: selectedImage?.previewUrl || null,
    });

    onSendMessage({
      chat,
      content: message.trim(),
      image: selectedImage?.dataUrl || null,
      clientTempId: optimisticMessage.id,
    });

    setMessage("");
    clearSelectedImage();
    setHideSuggestionsWhileTyping(true);
    onStopTyping(chat);
    smartReplies?.dismiss?.();
  };

  const clearSelectedImage = () => {
    setSelectedImage((currentImage) => {
      if (currentImage?.previewUrl) {
        URL.revokeObjectURL(currentImage.previewUrl);
      }

      return null;
    });
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImageError("");
    setIsReadingImage(true);

    try {
      const dataUrl = await readImageAsDataUrl(file);
      const previewUrl = URL.createObjectURL(file);

      setSelectedImage((currentImage) => {
        if (currentImage?.previewUrl) {
          URL.revokeObjectURL(currentImage.previewUrl);
        }

        return {
          dataUrl,
          previewUrl,
          name: file.name,
        };
      });
      setHideSuggestionsWhileTyping(true);
      smartReplies?.dismiss?.();
    } catch (error) {
      setImageError(error.message || "Please select a valid image");
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessage(value);
    messageEnhancement.clearError();

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

  const handleEnhanceTone = async (tone) => {
    const enhancedMessage = await messageEnhancement.enhanceMessage({
      message,
      tone,
    });

    if (!enhancedMessage) return;

    setMessage(enhancedMessage);
    setHideSuggestionsWhileTyping(true);
    smartReplies?.dismiss?.();
    onTyping(chat);
  };

  const shouldHideSuggestions = hideSuggestionsWhileTyping && Boolean(message.trim());
  const showSmartReplies = smartReplies?.visible && !shouldHideSuggestions && !canSend;

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
          {messageEnhancement.error ? (
            <motion.div
              className="mx-auto mb-3 max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-[#b91c1c]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role="status"
            >
              {messageEnhancement.error}
            </motion.div>
          ) : null}

          {imageError ? (
            <motion.div
              className="mx-auto mb-3 max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-[#b91c1c]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              role="status"
            >
              {imageError}
            </motion.div>
          ) : null}

          {selectedImage ? (
            <motion.div
              className="mx-auto mb-3 flex max-w-3xl items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] p-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <img
                src={selectedImage.previewUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1 pt-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {selectedImage.name}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Image ready to send
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelectedImage}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadingImage}
              aria-label="Attach image"
            >
              {isReadingImage ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ImagePlus size={20} />
              )}
            </Button>
            <AIEnhanceButton
              activeTone={messageEnhancement.activeTone}
              disabled={!chat?.id}
              isEnhancing={messageEnhancement.isEnhancing}
              message={message}
              onSelectTone={handleEnhanceTone}
              status={messageEnhancement.status}
            />
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
