import { Users } from "lucide-react";

const sizes = {
  sm: "size-8 text-[10px]",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

const statusSizes = {
  sm: "size-2 border",
  md: "size-3 border-2",
  lg: "size-3.5 border-2",
  xl: "size-4 border-2",
};

export function Avatar({
  name = "User",
  src,
  size = "md",
  isOnline,
  isGroup,
  className = "",
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-700 to-slate-900 font-semibold text-white ring-2 ring-white/10 ${sizes[size]} ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : isGroup ? (
        <Users size={size === "sm" ? 14 : 18} className="text-white/90" />
      ) : (
        initials || "?"
      )}
      {isOnline !== undefined ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[var(--bg-sidebar)] ${statusSizes[size]} ${
            isOnline ? "bg-[var(--online)] shadow-[0_0_8px_var(--online)]" : "bg-slate-500"
          }`}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}
