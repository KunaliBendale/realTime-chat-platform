import { ChatAvatar } from "./ChatAvatar";

export function RecentChats({ chats, selectedChatId, onSelectChat }) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-[#d9dee8] bg-white lg:border-r">
      <div className="border-b border-[#d9dee8] px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Chats
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#172033]">Messages</h1>
          </div>
          <button
            type="button"
            className="size-10 border border-[#cfd6e3] bg-[#f7f8fb] text-xl leading-none text-[#172033] transition hover:border-[#2563eb] hover:text-[#2563eb]"
            aria-label="Start new chat"
          >
            +
          </button>
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Search chats</span>
          <input
            type="search"
            placeholder="Search conversations"
            className="w-full border border-[#cfd6e3] bg-[#f7f8fb] px-3 py-2.5 text-sm text-[#172033] outline-none placeholder:text-[#8b97aa] focus:border-[#2563eb]"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto border-b border-[#d9dee8] lg:overflow-y-auto lg:border-b-0">
        <div className="flex gap-3 p-3 lg:block lg:space-y-1 lg:p-2">
          {chats.map((chat) => {
            const isSelected = selectedChatId === chat.id;

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={`flex min-w-[280px] items-start gap-3 border p-3 text-left transition lg:w-full lg:min-w-0 ${
                  isSelected
                    ? "border-[#2563eb] bg-[#eff6ff]"
                    : "border-transparent bg-white hover:border-[#d9dee8] hover:bg-[#f7f8fb]"
                }`}
              >
                <ChatAvatar initials={chat.avatar} status={chat.status} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-[#172033]">
                      {chat.name}
                    </span>
                    <span className="shrink-0 text-xs text-[#66758c]">
                      {chat.lastMessageAt}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#66758c]">
                    {chat.role}
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-[#4c5b70]">
                      {chat.lastMessage}
                    </span>
                    {chat.unreadCount ? (
                      <span className="grid size-5 shrink-0 place-items-center bg-[#f59e0b] text-xs font-semibold text-white">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
