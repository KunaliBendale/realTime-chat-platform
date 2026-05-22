import { Avatar } from "../ui/Avatar";

export function ChatAvatar({ initials, status, profilePic, isGroup, size = "md" }) {
  const isOnline = status === "online" || status === "active";

  return (
    <Avatar
      name={initials}
      src={profilePic}
      size={size}
      isOnline={isGroup ? undefined : isOnline}
      isGroup={isGroup}
    />
  );
}
