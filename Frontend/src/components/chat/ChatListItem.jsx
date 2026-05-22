import { motion } from "framer-motion";
import { UnreadBadge } from "../ui/Badge";
import { ChatAvatar } from "./ChatAvatar";

export function ChatListItem({ chat, isSelected, isOnline, onSelect }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
        isSelected
          ? "bg-gradient-to-r from-indigo-500/15 via-cyan-500/10 to-transparent ring-1 ring-indigo-400/30"
          : "hover:bg-white/5"
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <ChatAvatar
        initials={chat.avatar}
        profilePic={chat.profilePic}
        status={isOnline ? "online" : chat.status}
        isGroup={chat.isGroup}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm font-semibold ${
              isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"
            }`}
          >
            {chat.name}
          </span>
          <span className="shrink-0 text-[11px] text-[var(--text-muted)]">{chat.lastMessageAt}</span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-[var(--text-secondary)]">{chat.lastMessage}</span>
          <UnreadBadge count={chat.unreadCount} />
        </span>
      </span>
    </motion.button>
  );
}
