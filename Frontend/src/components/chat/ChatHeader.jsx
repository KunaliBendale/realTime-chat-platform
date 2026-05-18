import { ChatAvatar } from "./ChatAvatar";

export function ChatHeader({ chat }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[#d9dee8] bg-white px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <ChatAvatar initials={chat.avatar} status={chat.status} />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[#172033]">{chat.name}</h2>
          <p className="truncate text-sm text-[#66758c]">{chat.status}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden border border-[#cfd6e3] px-3 py-2 text-sm font-semibold text-[#172033] transition hover:border-[#2563eb] hover:text-[#2563eb] sm:inline-flex"
        >
          View profile
        </button>
        <button
          type="button"
          className="size-10 border border-[#cfd6e3] text-lg leading-none text-[#172033] transition hover:border-[#2563eb] hover:text-[#2563eb]"
          aria-label="Open chat menu"
        >
          ...
        </button>
      </div>
    </header>
  );
}
