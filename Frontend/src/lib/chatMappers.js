const getInitials = (name = "Chat") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    status: isGroup ? `${chat.users?.length || 0} members` : "offline",
    lastMessage: latestMessage?.message || latestMessage?.image || "No messages yet",
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
  const content = message.message || message.image || "";

  return {
    id: message._id || message.id,
    raw: message,
    sender: senderName,
    content,
    image: message.image,
    time: formatTime(message.createdAt),
    isOwn: senderId?.toString() === currentUserId?.toString(),
    isOptimistic: Boolean(message.isOptimistic),
  };
};

export const createOptimisticMessage = ({ chatId, content, image, currentUser }) => {
  const now = new Date();

  return {
    id: `temp-${now.getTime()}`,
    chatId,
    sender: currentUser?.name || "You",
    content: content || image || "",
    image,
    time: formatTime(now),
    isOwn: true,
    isOptimistic: true,
  };
};
