const getInitials = (name = "Chat") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

import { formatMessageTime } from "./formatDate";

const formatTime = formatMessageTime;
export const getMessagePreviewText = ({ message, image } = {}) => {
  if (message?.trim()) return message;
  if (image) return "📷 Image";
  return "No messages yet";
};

export const getOtherParticipant = (chat, currentUserId) => {
  return chat?.users?.find((user) => {
    const userId = user?._id || user?.id || user;
    return userId?.toString() !== currentUserId?.toString();
  });
};

export const mapChatFromApi = (chat, currentUserId) => {
  const otherParticipant = getOtherParticipant(chat, currentUserId);
  const isGroup = Boolean(chat.isGroup);
  const chatName = isGroup
    ? chat.chatName || "Group chat"
    : otherParticipant?.name || chat.chatName || "Direct chat";
  const latestMessage = chat.latestMessage;

  return {
    id: chat._id || chat.id,
    raw: chat,
    name: chatName,
    role: isGroup ? `${chat.users?.length || 0} members` : otherParticipant?.email || "Direct chat",
    avatar: getInitials(chatName),
    profilePic: isGroup ? null : otherParticipant?.profilePic,
    status: isGroup ? `${chat.users?.length || 0} members` : "offline",
    lastMessage: getMessagePreviewText(latestMessage),
    lastMessageAt: formatTime(latestMessage?.createdAt || chat.updatedAt),
    unreadCount: 0,
    isGroup,
    users: chat.users || [],
    groupAdmin: chat.groupAdmin,
    messages: [],
  };
};

export const mapMessageFromApi = (message, currentUserId) => {
  const senderId = message.sender?._id || message.sender;
  const senderName = message.sender?.name || "User";
  const content = message.message || "";

  const createdAt = message.createdAt || new Date().toISOString();

  return {
    id: message._id || message.id,
    raw: message,
    sender: senderName,
    content,
    image: message.image,
    time: formatTime(createdAt),
    createdAt,
    isOwn: senderId?.toString() === currentUserId?.toString(),
    isOptimistic: Boolean(message.isOptimistic),
    deliveredAt: message.deliveredAt,
    seenAt: message.seenAt,
  };
};

export const createOptimisticMessage = ({ chatId, content, image, currentUser }) => {
  const now = new Date();

  return {
    id: `temp-${now.getTime()}`,
    chatId,
    sender: currentUser?.name || "You",
    content: content || "",
    image,
    time: formatTime(now),
    createdAt: now.toISOString(),
    isOwn: true,
    isOptimistic: true,
  };
};

export const getSocketRecipientId = (chat, currentUserId) => {
  if (!chat || chat.isGroup) return null;

  const otherParticipant = getOtherParticipant(chat.raw || chat, currentUserId);

  return otherParticipant?._id || otherParticipant?.id || otherParticipant || null;
};
