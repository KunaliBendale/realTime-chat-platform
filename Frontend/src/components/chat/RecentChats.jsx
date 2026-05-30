import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, MoreVertical, Search, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ChatListSkeleton } from "../ui/Skeleton";
import { ChatListItem } from "./ChatListItem";

const getContactUserId = (contact) => contact.userId || contact.user?._id || contact.user?.id;

const getInitials = (name = "Contact") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function RecentChats({
  chats,
  contacts = [],
  selectedChatId,
  onlineUserIds = [],
  isLoading,
  isContactsLoading,
  onSelectChat,
  onStartContactChat,
  onOpenAction,
  onOpenSettings,
  onOpenOwnProfile,
}) {
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const menuItems = [
    { id: "addContact", label: "Add contact", icon: UserPlus },
    { id: "searchUser", label: "Find people", icon: Search },
    { id: "createGroup", label: "New group", icon: Users },
    { id: "directChat", label: "New chat", icon: MessageCircle },
  ];

  const directChatUserIds = new Set(
    chats
      .filter((chat) => !chat.isGroup)
      .flatMap((chat) =>
        (chat.users || []).map((u) => (u?._id || u?.id || u)?.toString()),
      ),
  );

  const sidebarContacts = contacts.filter((contact) => {
    const contactUserId = getContactUserId(contact)?.toString();
    return !contactUserId || !directChatUserIds.has(contactUserId);
  });

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chats;

    return chats.filter(
      (chat) =>
        chat.name?.toLowerCase().includes(query) ||
        chat.lastMessage?.toLowerCase().includes(query),
    );
  }, [chats, search]);

  const openAction = (actionId) => {
    setIsMenuOpen(false);
    onOpenAction(actionId);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-[var(--border-subtle)] bg-[var(--bg-sidebar)] lg:border-r">
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenOwnProfile || onOpenSettings}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 text-left transition hover:bg-white/5"
          >
            <Avatar name={user?.name || "You"} src={user?.profilePic} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                {user?.name || "You"}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </button>

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label="Open chat actions"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={20} />
            </Button>

            <AnimatePresence>
              {isMenuOpen ? (
                <motion.div
                  className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-[var(--border-subtle)] glass-elevated py-1.5"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                >
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openAction(item.id)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-indigo-500/10 hover:text-indigo-300"
                      >
                        <Icon size={17} />
                        {item.label}
                      </button>
                    );
                  })}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-input)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-indigo-400/40 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          {isLoading ? <ChatListSkeleton /> : null}

          {!isLoading && filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              {search ? "No chats match your search." : "No conversations yet."}
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {filteredChats.map((chat) => {
              const otherUserId = chat.users
                ?.map((u) => (u?._id || u?.id || u)?.toString())
                .find((id) => id && id !== user?._id && id !== user?.id);
              const isOnline = otherUserId
                ? onlineUserIds.includes(otherUserId)
                : false;

              return (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChatId === chat.id}
                  isOnline={isOnline}
                  onSelect={() => onSelectChat(chat.id)}
                />
              );
            })}
          </AnimatePresence>

          {!isContactsLoading && sidebarContacts.length ? (
            <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Contacts
            </p>
          ) : null}

          {!isContactsLoading &&
            sidebarContacts.map((contact) => {
              const contactUserId = getContactUserId(contact);
              const canStartChat = Boolean(contactUserId);

              return (
                <motion.button
                  key={contact.id || contact.mobile}
                  type="button"
                  onClick={() => {
                    if (canStartChat) onStartContactChat(contactUserId);
                  }}
                  disabled={!canStartChat}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5 disabled:opacity-60"
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-semibold text-white">
                    {contact.profilePic ? (
                      <img
                        src={contact.profilePic}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      getInitials(contact.name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {contact.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                      {canStartChat ? "Tap to start chat" : contact.mobile}
                    </span>
                  </span>
                  {canStartChat ? (
                    <MessageCircle size={16} className="shrink-0 text-indigo-400" />
                  ) : null}
                </motion.button>
              );
            })}
        </div>
      </div>
    </aside>
  );
}
