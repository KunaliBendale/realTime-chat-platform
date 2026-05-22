import { motion } from "framer-motion";
import { Check, CheckCheck, Clock, ImageIcon } from "lucide-react";
import { shouldClusterWithPrevious } from "../../lib/groupMessages";

export function MessageBubble({
  message,
  previousMessage,
  isGroup,
  showSenderName,
  onImageClick,
}) {
  const isClustered = shouldClusterWithPrevious(message, previousMessage);
  const isOwn = message.isOwn;

  const bubbleRadius = isOwn
    ? isClustered
      ? "rounded-2xl rounded-tr-md"
      : "rounded-2xl rounded-br-md"
    : isClustered
      ? "rounded-2xl rounded-tl-md"
      : "rounded-2xl rounded-bl-md";

  return (
    <motion.div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isClustered ? "mt-0.5" : "mt-3"}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      layout
    >
      <div
        className={`max-w-[min(82%,520px)] sm:max-w-[68%] ${bubbleRadius} px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isOwn
            ? "text-white [background:var(--bg-bubble-own)]"
            : "border border-[var(--border-subtle)] text-[var(--text-primary)] [background:var(--bg-bubble-other)]"
        }`}
      >
        {showSenderName && !isOwn ? (
          <p className="mb-1 text-xs font-semibold text-cyan-400">{message.sender}</p>
        ) : null}

        {message.image && !message.content?.startsWith("http") ? (
          <button
            type="button"
            onClick={() => onImageClick?.({ url: message.image, alt: "Shared image" })}
            className="group relative mb-1 block overflow-hidden rounded-xl"
          >
            <img
              src={message.image}
              alt=""
              className="max-h-64 w-full object-cover transition group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
              <ImageIcon
                size={24}
                className="text-white opacity-0 transition group-hover:opacity-100"
              />
            </span>
          </button>
        ) : null}

        {message.content && !(message.image && message.content === message.image) ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : message.image ? (
          <button
            type="button"
            onClick={() => onImageClick?.({ url: message.image, alt: "Shared image" })}
            className="flex items-center gap-2 text-left underline-offset-2 hover:underline"
          >
            <ImageIcon size={16} />
            View attachment
          </button>
        ) : null}

        <motion.div
          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
            isOwn ? "text-white/75" : "text-[var(--text-muted)]"
          }`}
        >
          <span>{message.time}</span>
          {message.isOptimistic ? (
            <Clock size={12} aria-label="Sending" />
          ) : isOwn ? (
            message.seenAt ? (
              <CheckCheck size={12} className="text-cyan-200" aria-label="Seen" />
            ) : message.deliveredAt ? (
              <CheckCheck size={12} aria-label="Delivered" />
            ) : (
              <Check size={12} aria-label="Sent" />
            )
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}
