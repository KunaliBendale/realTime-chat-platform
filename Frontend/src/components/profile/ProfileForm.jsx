import { CheckCircle2, Loader2, LogOut, Mail, Phone, Signal, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { AvatarUpload } from "./AvatarUpload";

export function ProfileForm({
  user,
  isSaving,
  isUploading,
  message,
  error,
  onSave,
  onUploadImage,
  onFileError,
  onLogout,
}) {
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    mobile: user?.mobile || "",
    status: user?.status || "active",
  }));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave?.({
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      status: form.status,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <AvatarUpload
          user={user}
          isOnline
          disabled={isSaving}
          isUploading={isUploading}
          onUpload={onUploadImage}
          onError={onFileError}
        />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-[var(--text-primary)]">
            {user?.name || "Your profile"}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Update your public chat details.
          </p>
        </div>
      </div>

      {message ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={17} />
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field icon={UserRound} label="Name">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={isSaving}
            className="profile-input"
            placeholder="Your name"
            required
          />
        </Field>

        <Field icon={Phone} label="Mobile">
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            disabled={isSaving}
            className="profile-input"
            inputMode="numeric"
            maxLength={10}
            placeholder="10 digit mobile number"
            required
          />
        </Field>

        <Field icon={Mail} label="Email">
          <input value={user?.email || ""} disabled className="profile-input opacity-70" />
        </Field>

        <Field icon={Signal} label="Status">
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={isSaving}
            className="profile-input"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Button
          type="submit"
          disabled={isSaving || isUploading}
          className="w-full"
          isLoading={isSaving}
        >
          {isSaving ? <Loader2 size={17} className="animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save profile"}
        </Button>

        <Button
          type="button"
          variant="danger"
          onClick={onLogout}
          disabled={isSaving || isUploading}
          className="w-full sm:w-auto"
        >
          <LogOut size={17} />
          Logout
        </Button>
      </div>
    </form>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        <Icon size={14} />
        {label}
      </span>
      {children}
    </label>
  );
}
