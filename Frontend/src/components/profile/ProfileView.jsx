import { CalendarDays, Mail, Phone, ShieldCheck, Signal, Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { StatusPill } from "../ui/Badge";

const formatDate = (value) => {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getProviderLabel = (providers = []) => {
  if (!providers.length) return "Email account";

  return providers
    .map((item) => item.provider)
    .filter(Boolean)
    .join(", ");
};

export function ProfileView({ user, isOnline, isGroup, membersCount }) {
  const title = user?.name || (isGroup ? "Group chat" : "Contact");

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <Avatar
          name={title}
          src={user?.profilePic}
          size="xl"
          isGroup={isGroup}
          isOnline={!isGroup ? isOnline : undefined}
          className="ring-4 ring-white/10"
        />

        <div className="min-w-0">
          <h3 className="max-w-full truncate text-xl font-bold text-[var(--text-primary)]">
            {title}
          </h3>

          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            {isGroup ? (
              <StatusPill>
                <Users size={12} />
                {membersCount || 0} members
              </StatusPill>
            ) : (
              <StatusPill variant={isOnline ? "online" : "offline"}>
                <span
                  className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`}
                />
                {isOnline ? "Online" : user?.status || "Offline"}
              </StatusPill>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 text-left sm:grid-cols-2">
        {!isGroup ? <InfoRow icon={Mail} label="Email" value={user?.email} /> : null}
        {!isGroup ? <InfoRow icon={Phone} label="Mobile" value={user?.mobile} /> : null}
        {!isGroup ? <InfoRow icon={Signal} label="Status" value={user?.status} /> : null}
        {!isGroup ? (
          <InfoRow icon={ShieldCheck} label="Account" value={getProviderLabel(user?.providers)} />
        ) : null}
        <InfoRow
          icon={CalendarDays}
          label={isGroup ? "Conversation" : "Joined"}
          value={formatDate(user?.createdAt)}
          className={isGroup ? "" : "sm:col-span-2"}
        />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/5 px-4 py-3 ${className}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}
