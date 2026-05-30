import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../ui/Avatar";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function AvatarUpload({
  user,
  isOnline,
  disabled,
  isUploading,
  onUpload,
  onError,
}) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("Please select a valid image");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      onError?.("Image size must be under 5MB");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    await onUpload?.(file);
  };

  return (
    <div className="relative">
      <Avatar
        name={user?.name || "You"}
        src={previewUrl || user?.profilePic}
        size="xl"
        isOnline={isOnline}
        className="ring-4 ring-white/10"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-lg transition hover:border-indigo-400/40 hover:text-indigo-300 disabled:opacity-60"
        aria-label="Update profile image"
      >
        {isUploading ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
