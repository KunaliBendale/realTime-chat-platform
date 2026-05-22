import { Mail, Phone, Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Modal } from "../ui/Modal";
import { StatusPill } from "../ui/Badge";

export function ProfileModal({ isOpen, onClose, chat, isOnline }) {
  if (!chat) return null;

  const profilePic =
    chat.raw?.users?.find((user) => user?.name === chat.name)?.profilePic || null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={chat.name}
      description={chat.isGroup ? "Group conversation" : "Contact profile"}
      size="md"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar
          name={chat.name}
          src={profilePic}
          size="xl"
          isGroup={chat.isGroup}
          isOnline={!chat.isGroup ? isOnline : undefined}
        />

        <h3 className="mt-4 text-xl font-bold text-[var(--text-primary)]">{chat.name}</h3>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {chat.isGroup ? (
            <StatusPill>
              <Users size={12} />
              {chat.role}
            </StatusPill>
          ) : (
            <StatusPill variant={isOnline ? "online" : "offline"}>
              <span
                className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`}
              />
              {isOnline ? "Online" : chat.status || "Offline"}
            </StatusPill>
          )}
        </div>

        <div className="mt-8 w-full space-y-3 text-left">
          {!chat.isGroup && chat.role ? (
            <InfoRow icon={Mail} label="Email" value={chat.role} />
          ) : null}
          {chat.isGroup ? (
            <InfoRow icon={Users} label="Members" value={`${chat.users?.length || 0} participants`} />
          ) : (
            <InfoRow icon={Phone} label="Status" value={chat.status || "Available on chat"} />
          )}
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/5 px-4 py-3">
      <span className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}
