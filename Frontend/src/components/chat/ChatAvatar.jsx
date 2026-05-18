export function ChatAvatar({ initials, status }) {
  const isOnline = status === "online";

  return (
    <div className="relative grid size-11 shrink-0 place-items-center bg-[#172033] text-sm font-semibold text-white">
      {initials}
      {isOnline ? (
        <span className="absolute -bottom-0.5 -right-0.5 size-3 border-2 border-white bg-[#10b981]" />
      ) : null}
    </div>
  );
}
