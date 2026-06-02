import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/Button";
import { StatusPill } from "../ui/Badge";
import { ChatAvatar } from "./ChatAvatar";

export function ChatHeader({
  chat,
  isTyping,
  isOnline,
  showBack,
  onBack,
  onOpenProfile,
  onLogout,
}) {
  const { isDark, toggleTheme } = useTheme();
  const ThemeIcon = isDark ? Sun : Moon;
  const statusText = isTyping
    ? "typing..."
    : chat.isGroup
      ? chat.role
      : isOnline
        ? "online"
        : chat.status || "offline";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2.5 backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {showBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to chats">
            <ArrowLeft size={20} />
          </Button>
        ) : null}

        <motion.button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1.5 text-left transition hover:bg-white/5"
          onClick={onOpenProfile}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <ChatAvatar
            initials={chat.avatar}
            profilePic={chat.profilePic}
            status={isOnline ? "online" : chat.status}
            isGroup={chat.isGroup}
          />
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[var(--text-primary)]">
              {chat.name}
            </h2>
            {isTyping ? (
              <p className="truncate text-sm font-medium text-indigo-400">{statusText}</p>
            ) : (
              <StatusPill variant={isOnline && !chat.isGroup ? "online" : "default"}>
                {!chat.isGroup && isOnline ? (
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                ) : null}
                <span className="truncate">{statusText}</span>
              </StatusPill>
            )}
          </div>
        </motion.button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <ThemeIcon size={18} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sign out">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
