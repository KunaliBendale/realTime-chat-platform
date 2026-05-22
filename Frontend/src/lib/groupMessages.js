import { formatDateSeparator, getDateKey } from "./formatDate";

export const groupMessagesByDate = (messages = []) => {
  const groups = [];
  let currentGroup = null;

  messages.forEach((message) => {
    const createdAt = message.createdAt || message.raw?.createdAt || new Date().toISOString();
    const dateKey = getDateKey(createdAt);

    if (!currentGroup || currentGroup.dateKey !== dateKey) {
      currentGroup = {
        dateKey,
        label: formatDateSeparator(createdAt),
        messages: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.messages.push(message);
  });

  return groups;
};

export const shouldShowSenderName = (message, previousMessage, isGroup) => {
  if (!isGroup || message.isOwn) return false;
  if (!previousMessage) return true;

  return previousMessage.sender !== message.sender || previousMessage.isOwn !== message.isOwn;
};

export const shouldClusterWithPrevious = (message, previousMessage) => {
  if (!previousMessage) return false;
  if (message.isOwn !== previousMessage.isOwn) return false;
  if (message.sender !== previousMessage.sender) return false;

  const currentTime = new Date(message.createdAt || 0).getTime();
  const previousTime = new Date(previousMessage.createdAt || 0).getTime();

  if (Number.isNaN(currentTime) || Number.isNaN(previousTime)) return true;

  return currentTime - previousTime < 5 * 60 * 1000;
};
