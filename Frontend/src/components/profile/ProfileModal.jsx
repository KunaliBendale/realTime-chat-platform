import { Loader2, UserRound } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ProfileForm } from "./ProfileForm";
import { ProfileView } from "./ProfileView";

export function ProfileModal({
  isOpen,
  onClose,
  user,
  isOwn,
  isGroup,
  isOnline,
  membersCount,
  isSaving,
  isUploading,
  isLoading,
  message,
  error,
  onSave,
  onUploadImage,
  onFileError,
  onLogout,
}) {
  const title = isOwn ? "My profile" : isGroup ? "Group profile" : "Contact profile";
  const description = isOwn
    ? "Manage the details people see in chat."
    : isGroup
      ? "Group conversation details."
      : "Profile details for this contact.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={UserRound}
      size="md"
      scrollable={false}
      bodyClassName="px-4 py-4 sm:px-5 sm:py-5"
    >
      {isLoading ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 size={24} className="animate-spin text-indigo-300" />
          <p className="text-sm">Loading profile...</p>
        </div>
      ) : isOwn ? (
        <ProfileForm
          key={user?._id || user?.id || user?.email || "own-profile"}
          user={user}
          isSaving={isSaving}
          isUploading={isUploading}
          message={message}
          error={error}
          onSave={onSave}
          onUploadImage={onUploadImage}
          onFileError={onFileError}
          onLogout={onLogout}
        />
      ) : (
        <ProfileView
          user={user}
          isOnline={isOnline}
          isGroup={isGroup}
          membersCount={membersCount}
        />
      )}
    </Modal>
  );
}
