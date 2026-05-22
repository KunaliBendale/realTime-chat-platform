export function Input({ label, error, icon: Icon, className = "", id, ...props }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {Icon ? (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
        ) : null}
        <input
          id={id}
          className={`w-full rounded-2xl border bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm transition placeholder:text-[var(--text-muted)] focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 ${
            Icon ? "pl-11" : ""
          } ${
            error
              ? "border-red-400/60 focus:border-red-400 focus:ring-red-500/10"
              : "border-[var(--border-subtle)]"
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs font-medium text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
