export function AuthAlert({ type = "error", message }) {
  if (!message) return null;

  const styles =
    type === "success"
      ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
      : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]";

  return (
    <div className={`border px-3 py-3 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}
