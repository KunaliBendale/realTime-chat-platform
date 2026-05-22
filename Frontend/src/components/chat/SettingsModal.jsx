import { Bell, LogOut, Moon, Sun, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function SettingsModal({ isOpen, onClose, socketStatus }) {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login", { replace: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" description="Preferences & account">
      <div className="space-y-3">
        <SettingRow
          icon={isDark ? Moon : Sun}
          title="Appearance"
          description={`${theme === "dark" ? "Dark" : "Light"} mode`}
          action={
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              Switch to {isDark ? "light" : "dark"}
            </Button>
          }
        />

        <SettingRow
          icon={Wifi}
          title="Connection"
          description={`Real-time socket: ${socketStatus}`}
        />

        <SettingRow
          icon={Bell}
          title="Notifications"
          description="Push notifications coming soon"
        />

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Signed in as
          </p>
          <p className="mt-1 font-semibold text-[var(--text-primary)]">{user?.name}</p>
          <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
        </div>

        <Button variant="danger" className="mt-4 w-full" onClick={handleLogout}>
          <LogOut size={18} />
          Sign out
        </Button>
      </div>
    </Modal>
  );
}

function SettingRow({ icon: Icon, title, description, action }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-white/5 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
