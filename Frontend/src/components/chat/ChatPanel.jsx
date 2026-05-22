import { ChatHeader } from "./ChatHeader";
import { MessageArea } from "./MessageArea";
import { MessageInput } from "./MessageInput";

export function ChatPanel({
  chat,
  messages,
  isLoading,
  isTyping,
  isOnline,
  showBack,
  onBack,
  onOpenProfile,
  onOpenSettings,
  onImageClick,
  onPrepareOptimisticMessage,
  onSendMessage,
  onTyping,
  onStopTyping,
}) {
  if (!chat) {
    return null;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[var(--bg-chat)]">
      <ChatHeader
        chat={chat}
        isTyping={isTyping}
        isOnline={isOnline}
        showBack={showBack}
        onBack={onBack}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
      />
      <MessageArea
        messages={messages}
        isLoading={isLoading}
        isTyping={isTyping}
        typingName={chat.isGroup ? "Someone" : chat.name}
        isGroup={chat.isGroup}
        onImageClick={onImageClick}
      />
      <MessageInput
        chat={chat}
        onPrepareOptimisticMessage={onPrepareOptimisticMessage}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
      />
    </section>
  );
}
