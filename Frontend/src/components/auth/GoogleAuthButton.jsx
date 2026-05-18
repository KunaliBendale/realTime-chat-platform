import { API_BASE_URL } from "../../config/env";

export function GoogleAuthButton({ label = "Continue with Google" }) {
  return (
    <a
      href={`${API_BASE_URL}/auth/google`}
      className="flex w-full items-center justify-center gap-3 border border-[#cfd6e3] bg-white px-4 py-3 text-sm font-semibold text-[#172033] transition hover:border-[#2563eb] hover:text-[#2563eb]"
    >
      <span className="grid size-5 place-items-center border border-[#d9dee8] text-xs font-bold text-[#2563eb]">
        G
      </span>
      {label}
    </a>
  );
}
