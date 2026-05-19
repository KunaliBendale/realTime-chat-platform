import { useEffect, useRef, useState } from "react";
import { MessageCircle, MoreVertical, Search, UserPlus, Users } from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";

const getInitials = (name = "Contact") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const getContactUserId = (contact) => contact.userId || contact.user?._id || contact.user?.id;

export function RecentChats({
  chats,
  contacts = [],
  selectedChat,
  selectedChatId,
  isLoading,
  isContactsLoading,
  onSelectChat,
  onStartContactChat,
  onOpenAction,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const menuItems = [
    { id: "addContact", label: "Add User", icon: UserPlus },
    { id: "searchUser", label: "Search Contacts", icon: Search },
    { id: "createGroup", label: "Create Group", icon: Users },
    { id: "directChat", label: "New Chat", icon: MessageCircle },
  ];

  const directChatUserIds = new Set(
    chats
      .filter((chat) => !chat.isGroup)
      .flatMap((chat) =>
        (chat.users || []).map((user) => (user?._id || user?.id || user)?.toString()),
      ),
  );
  const sidebarContacts = contacts.filter((contact) => {
    const contactUserId = getContactUserId(contact)?.toString();

    return !contactUserId || !directChatUserIds.has(contactUserId);
  });

  const openAction = (actionId) => {
    setIsMenuOpen(false);
    onOpenAction(actionId);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-[#d9dee8] bg-[#f8fafc] lg:border-r">
      <div className="border-b border-[#d9dee8] bg-white px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#128c7e]">
              Chats
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#172033]">Messages</h1>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="grid size-10 place-items-center rounded-lg border border-[#d9dee8] bg-[#f8fafc] text-[#172033] transition hover:border-[#128c7e] hover:bg-[#e8f5f2] hover:text-[#128c7e]"
              aria-label="Open chat actions"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={20} strokeWidth={2.3} />
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-lg border border-[#d9dee8] bg-white py-1 shadow-xl shadow-[#172033]/10">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openAction(item.id)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#172033] transition hover:bg-[#e8f5f2] hover:text-[#128c7e]"
                    >
                      <Icon size={17} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-b border-[#d9dee8] lg:border-b-0">
        <div className="space-y-1.5 p-2.5">
          {isLoading ? (
            <div className="rounded-lg border border-[#d9dee8] bg-white p-4 text-sm text-[#66758c]">
              Loading chats...
            </div>
          ) : null}

          {!isLoading && chats.length === 0 ? (
            <div className="rounded-lg border border-[#d9dee8] bg-white p-4 text-sm text-[#66758c]">
              No conversations yet.
            </div>
          ) : null}

          {chats.map((chat) => {
            const isSelected = selectedChatId === chat.id;

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? "border-[#128c7e] bg-[#e8f5f2] shadow-sm"
                    : "border-transparent bg-white hover:border-[#d9dee8] hover:bg-[#f8fafc]"
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
                  <span className="mt-0.5 block truncate text-xs text-[#66758c]">
                    {selectedChat?.id === chat.id && chat.isGroup ? "Selected group" : chat.role}
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-[#4c5b70]">
                      {chat.lastMessage}
                    </span>
                    {chat.unreadCount ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#25d366] text-xs font-semibold text-white">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}

          {isContactsLoading ? (
            <div className="rounded-lg border border-[#d9dee8] bg-white p-4 text-sm text-[#66758c]">
              Loading contacts...
            </div>
          ) : null}

          {!isContactsLoading && sidebarContacts.length ? (
            <div className="px-1 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b97aa]">
              Contacts
            </div>
          ) : null}

          {!isContactsLoading &&
            sidebarContacts.map((contact) => {
              const contactUserId = getContactUserId(contact);
              const canStartChat = Boolean(contactUserId);

              return (
                <button
                  key={contact.id || contact.mobile}
                  type="button"
                  onClick={() => {
                    if (canStartChat) onStartContactChat(contactUserId);
                  }}
                  disabled={!canStartChat}
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-white p-3 text-left transition hover:border-[#d9dee8] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-75"
                >
                  <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-[#172033] text-sm font-semibold text-white">
                    {contact.profilePic ? (
                      <img
                        src={contact.profilePic}
                        alt=""
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(contact.name)
                    )}
                    {contact.status === "active" ? (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-[#25d366]" />
                    ) : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-[#172033]">
                        {contact.name}
                      </span>
                      {canStartChat ? (
                        <MessageCircle size={16} className="shrink-0 text-[#128c7e]" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#66758c]">
                      {contact.mobile}
                    </span>
                    <span className="mt-1.5 block truncate text-sm text-[#4c5b70]">
                      {canStartChat ? "Start chat" : "Saved contact"}
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
