export function UnreadBadge({ count }) {
  if (!count) return null;

  const label = count > 99 ? "99+" : count;

  return (
    <span className="grid min-w-5 place-items-center rounded-full bg-[var(--unread)] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/30">
      {label}
    </span>
  );
}

export function StatusPill({ children, variant = "default" }) {
  const styles = {
    default: "bg-white/10 text-[var(--text-secondary)]",
    online: "bg-emerald-500/15 text-emerald-400",
    offline: "bg-slate-500/15 text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
