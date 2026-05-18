import { ChatHeader } from "./ChatHeader";
import { MessageArea } from "./MessageArea";
import { MessageInput } from "./MessageInput";

export function ChatPanel({ chat, messages, isLoading, onPrepareOptimisticMessage }) {
  if (!chat) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center bg-[#f7f8fb] p-6 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            No conversation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#172033]">
            Select or start a chat
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <ChatHeader chat={chat} />
      <MessageArea messages={messages} isLoading={isLoading} />
      <MessageInput chatId={chat.id} onPrepareOptimisticMessage={onPrepareOptimisticMessage} />
    </section>
  );
}
