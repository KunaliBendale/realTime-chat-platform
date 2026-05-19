import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen flex-col bg-[#f7f8fb] text-[#172033]">
      <header className="shrink-0 border-b border-[#d9dee8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              RealTime Chat
            </p>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-[#66758c]">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="border border-[#cfd6e3] bg-white px-4 py-2 text-sm font-semibold text-[#172033] transition hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
