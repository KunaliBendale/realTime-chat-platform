import { AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import {
  groupMessagesByDate,
  shouldShowSenderName,
} from "../../lib/groupMessages";
import { MessageListSkeleton } from "../ui/Skeleton";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

function DateSeparator({ label }) {
  return (
    <div className="sticky top-2 z-10 flex justify-center py-3">
      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] shadow-sm backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}

export function MessageArea({
  messages,
  isLoading,
  isTyping,
  typingName,
  isGroup,
  onImageClick,
}) {
  const { containerRef, handleScroll } = useAutoScroll([messages.length, isTyping]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  if (isLoading && !messages.length) {
    return (
      <section className="custom-scrollbar min-h-0 flex-1 overflow-y-auto chat-pattern">
        <MessageListSkeleton />
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      onScroll={handleScroll}
      className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto chat-pattern"
    >
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-3 py-4 sm:px-5">
        {groupedMessages.map((group) => (
          <div key={group.dateKey}>
            <DateSeparator label={group.label} />
            {group.messages.map((message, index) => {
              const previousMessage = index > 0 ? group.messages[index - 1] : null;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  previousMessage={previousMessage}
                  isGroup={isGroup}
                  showSenderName={shouldShowSenderName(
                    message,
                    previousMessage,
                    isGroup,
                  )}
                  onImageClick={onImageClick}
                />
              );
            })}
          </div>
        ))}

        <AnimatePresence>
          {isTyping ? <TypingIndicator name={typingName} /> : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
