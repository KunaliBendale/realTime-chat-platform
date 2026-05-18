import { ChatHeader } from "./ChatHeader";
import { MessageArea } from "./MessageArea";
import { MessageInput } from "./MessageInput";

export function ChatPanel({ chat }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <ChatHeader chat={chat} />
      <MessageArea messages={chat.messages} />
      <MessageInput />
    </section>
  );
}
