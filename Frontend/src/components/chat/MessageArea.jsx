import { MessageBubble } from "./MessageBubble";

export function MessageArea({ messages, isLoading }) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fb] px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="self-center border border-[#d9dee8] bg-white px-3 py-1 text-xs font-medium text-[#66758c]">
          Today
        </div>

        {isLoading ? (
          <div className="self-center border border-[#d9dee8] bg-white px-4 py-3 text-sm text-[#66758c]">
            Loading messages...
          </div>
        ) : null}

        {!isLoading && messages.length === 0 ? (
          <div className="self-center border border-[#d9dee8] bg-white px-4 py-3 text-sm text-[#66758c]">
            No messages in this conversation yet.
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </section>
  );
}
