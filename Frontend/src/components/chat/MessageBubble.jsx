export function MessageBubble({ message }) {
  return (
    <div className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[68%] ${
          message.isOwn
            ? "bg-[#2563eb] text-white"
            : "border border-[#d9dee8] bg-white text-[#172033]"
        }`}
      >
        {!message.isOwn ? (
          <p className="mb-1 text-xs font-semibold text-[#2563eb]">{message.sender}</p>
        ) : null}
        <p>{message.content}</p>
        <p
          className={`mt-2 text-right text-[11px] ${
            message.isOwn ? "text-[#dbeafe]" : "text-[#66758c]"
          }`}
        >
          {message.time}
          {message.isOptimistic ? " · pending" : ""}
        </p>
      </div>
    </div>
  );
}
