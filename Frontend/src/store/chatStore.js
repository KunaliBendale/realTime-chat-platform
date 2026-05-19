import { create } from "zustand";
import {
  createOptimisticMessage,
  mapChatFromApi,
  mapMessageFromApi,
} from "../lib/chatMappers";
import { tokenStorage } from "../lib/tokenStorage";
import { chatService } from "../services/chatService";
import { contactService } from "../services/contactService";
import { useAuthStore } from "./authStore";

const getCurrentUser = () => useAuthStore.getState().user;
const getCurrentUserId = () => getCurrentUser()?._id || getCurrentUser()?.id;

const upsertChat = (chats, chat) => {
  const existingIndex = chats.findIndex((item) => item.id === chat.id);

  if (existingIndex === -1) {
    return [chat, ...chats];
  }

  return chats.map((item) => (item.id === chat.id ? chat : item));
};

const mapContactFromApi = (contact) => {
  const linkedUser = contact.user || contact.contactUser;
  const userId = contact.userId || linkedUser?._id || linkedUser?.id || null;
  const name = contact.displayName || contact.name || linkedUser?.name || "Saved contact";

  return {
    id: contact._id || contact.id || contact.mobile,
    name,
    displayName: name,
    mobile: contact.mobile || linkedUser?.mobile || "",
    email: contact.email || linkedUser?.email || "",
    profilePic: contact.profilePic || linkedUser?.profilePic || "",
    status: contact.status || linkedUser?.status || "inactive",
    userId,
    user: linkedUser || null,
    isRegistered: Boolean(contact.isRegistered ?? userId),
    updatedAt: contact.updatedAt,
    raw: contact,
  };
};

const upsertContact = (contacts, contact) => {
  const existingIndex = contacts.findIndex(
    (item) => item.id === contact.id || item.mobile === contact.mobile,
  );

  if (existingIndex === -1) {
    return [...contacts, contact];
  }

  return contacts.map((item, index) => (index === existingIndex ? contact : item));
};

export const useChatStore = create((set, get) => ({
  chats: [],
  selectedChatId: null,
  messagesByChatId: {},
  nextCursorByChatId: {},
  contacts: [],
  isUsingPreviewData: false,
  isChatsLoading: false,
  isMessagesLoading: false,
  isContactsLoading: false,
  actionLoading: null,
  socketStatus: "disconnected",
  onlineUserIds: [],
  typingByChatId: {},
  userSearchResults: [],
  isUserSearchLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchContacts: async () => {
    if (!tokenStorage.getToken()) {
      set({ contacts: [], isContactsLoading: false });
      return { success: false };
    }

    set({ isContactsLoading: true, error: null });

    try {
      const contacts = await contactService.fetchContacts();

      set({
        contacts: contacts.map(mapContactFromApi),
        isContactsLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      set({
        isContactsLoading: false,
        error: error.message || "Unable to fetch contacts",
      });

      return { success: false, message: error.message };
    }
  },

  addContact: async ({ name, mobile }) => {
    set({ actionLoading: "addContact", error: null });

    try {
      const contact = await contactService.addContact({ name, mobile });
      const mappedContact = mapContactFromApi(contact);

      set((state) => ({
        contacts: upsertContact(state.contacts, mappedContact),
        actionLoading: null,
        error: null,
      }));

      return { success: true, contact: mappedContact };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to add contact",
      });

      return { success: false, message: error.message };
    }
  },

  fetchChats: async () => {
    if (!tokenStorage.getToken()) {
      set({
        isUsingPreviewData: true,
        isChatsLoading: false,
        error: "Sign in to load backend chats. Preview data is shown for now.",
      });
      return { success: false };
    }

    set({ isChatsLoading: true, error: null });

    try {
      const chats = await chatService.fetchChats();
      const mappedChats = chats.map((chat) => mapChatFromApi(chat, getCurrentUserId()));
      const selectedChatId = get().selectedChatId || mappedChats[0]?.id || null;

      set({
        chats: mappedChats,
        selectedChatId,
        isUsingPreviewData: false,
        isChatsLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      set({
        isChatsLoading: false,
        error: error.message || "Unable to fetch chats",
      });

      return { success: false, message: error.message };
    }
  },

  openConversation: async (chatId) => {
    set({ selectedChatId: chatId });

    if (!chatId || !tokenStorage.getToken()) {
      return { success: false };
    }

    return get().fetchMessages(chatId);
  },

  fetchMessages: async (chatId, options = {}) => {
    if (!chatId) return { success: false };

    if (!tokenStorage.getToken()) {
      set({
        error: "Sign in to load backend messages. Preview data is shown for now.",
      });
      return { success: false };
    }

    set({ isMessagesLoading: true, error: null });

    try {
      const response = await chatService.fetchMessages(chatId, options);
      const messages = (response.messages || []).map((message) =>
        mapMessageFromApi(message, getCurrentUserId()),
      );

      set((state) => ({
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: options.before
            ? [...messages, ...(state.messagesByChatId[chatId] || [])]
            : messages,
        },
        nextCursorByChatId: {
          ...state.nextCursorByChatId,
          [chatId]: response.nextCursor,
        },
        isMessagesLoading: false,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      set({
        isMessagesLoading: false,
        error: error.message || "Unable to fetch messages",
      });

      return { success: false, message: error.message };
    }
  },

  accessChat: async (userId) => {
    set({ actionLoading: "accessChat", error: null });

    try {
      const chat = await chatService.accessChat(userId);
      const mappedChat = mapChatFromApi(chat, getCurrentUserId());

      set((state) => ({
        chats: upsertChat(state.chats, mappedChat),
        selectedChatId: mappedChat.id,
        actionLoading: null,
        error: null,
      }));

      await get().fetchMessages(mappedChat.id);

      return { success: true, chat: mappedChat };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to access chat",
      });

      return { success: false, message: error.message };
    }
  },

  searchUsers: async (search) => {
    if (!tokenStorage.getToken()) {
      set({ userSearchResults: [] });
      return { success: false };
    }

    if (!search?.trim()) {
      set({ userSearchResults: [], isUserSearchLoading: false });
      return { success: true, users: [] };
    }

    set({ isUserSearchLoading: true, error: null });

    try {
      const users = await chatService.searchUsers(search);

      set({
        userSearchResults: users,
        isUserSearchLoading: false,
        error: null,
      });

      return { success: true, users };
    } catch (error) {
      set({
        isUserSearchLoading: false,
        error: error.message || "Unable to search users",
      });

      return { success: false, message: error.message };
    }
  },

  createGroup: async ({ chatName, users }) => {
    set({ actionLoading: "createGroup", error: null });

    try {
      const chat = await chatService.createGroup({ chatName, users });
      const mappedChat = mapChatFromApi(chat, getCurrentUserId());

      set((state) => ({
        chats: upsertChat(state.chats, mappedChat),
        selectedChatId: mappedChat.id,
        actionLoading: null,
        error: null,
      }));

      return { success: true, chat: mappedChat };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to create group",
      });

      return { success: false, message: error.message };
    }
  },

  updateGroup: async (chatId, payload) => {
    set({ actionLoading: "updateGroup", error: null });

    try {
      const chat = await chatService.updateGroup(chatId, payload);
      const mappedChat = mapChatFromApi(chat, getCurrentUserId());

      set((state) => ({
        chats: upsertChat(state.chats, mappedChat),
        selectedChatId: mappedChat.id,
        actionLoading: null,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to update group",
      });

      return { success: false, message: error.message };
    }
  },

  addUsersToGroup: async (chatId, users) => {
    set({ actionLoading: "addUsers", error: null });

    try {
      const chat = await chatService.addUsersToGroup(chatId, users);
      const mappedChat = mapChatFromApi(chat, getCurrentUserId());

      set((state) => ({
        chats: upsertChat(state.chats, mappedChat),
        actionLoading: null,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to add users",
      });

      return { success: false, message: error.message };
    }
  },

  removeUsersFromGroup: async (chatId, users) => {
    set({ actionLoading: "removeUsers", error: null });

    try {
      const chat = await chatService.removeUsersFromGroup(chatId, users);
      const mappedChat = mapChatFromApi(chat, getCurrentUserId());

      set((state) => ({
        chats: upsertChat(state.chats, mappedChat),
        actionLoading: null,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to remove users",
      });

      return { success: false, message: error.message };
    }
  },

  deleteGroup: async (chatId) => {
    set({ actionLoading: "deleteGroup", error: null });

    try {
      await chatService.deleteGroup(chatId);

      set((state) => {
        const chats = state.chats.filter((chat) => chat.id !== chatId);
        const { [chatId]: _removedMessages, ...messagesByChatId } =
          state.messagesByChatId;

        return {
          chats,
          messagesByChatId,
          selectedChatId: chats[0]?.id || null,
          actionLoading: null,
          error: null,
        };
      });

      return { success: true };
    } catch (error) {
      set({
        actionLoading: null,
        error: error.message || "Unable to delete group",
      });

      return { success: false, message: error.message };
    }
  },

  prepareOptimisticMessage: ({ chatId, content, image }) => {
    const optimisticMessage = createOptimisticMessage({
      chatId,
      content,
      image,
      currentUser: getCurrentUser(),
    });

    set((state) => ({
      messagesByChatId: {
        ...state.messagesByChatId,
        [chatId]: [...(state.messagesByChatId[chatId] || []), optimisticMessage],
      },
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage: optimisticMessage.content,
              lastMessageAt: optimisticMessage.time,
            }
          : chat,
      ),
    }));

    return optimisticMessage;
  },

  sendMessageWithRest: async ({ chatId, receiverId, content, image, clientTempId }) => {
    try {
      const message = await chatService.sendMessage(chatId, {
        receiverId,
        content,
        image,
        clientTempId,
      });

      get().upsertIncomingMessage(message);

      return { success: true, message };
    } catch (error) {
      set({
        error: error.message || "Unable to send message",
      });

      return { success: false, message: error.message };
    }
  },

  setSocketStatus: (socketStatus) => set({ socketStatus }),

  setOnlineUsers: (onlineUserIds) => set({ onlineUserIds }),

  setUserStatus: ({ userId, status, lastSeen }) => {
    set((state) => {
      const onlineSet = new Set(state.onlineUserIds);

      if (status === "online") {
        onlineSet.add(userId);
      } else {
        onlineSet.delete(userId);
      }

      const chats = state.chats.map((chat) => {
        const hasUser = chat.users?.some((user) => {
          const participantId = user?._id || user?.id || user;
          return participantId?.toString() === userId?.toString();
        });

        if (!hasUser || chat.isGroup) return chat;

        return {
          ...chat,
          status: status === "online" ? "online" : lastSeen ? `last seen ${lastSeen}` : "offline",
        };
      });

      return {
        onlineUserIds: Array.from(onlineSet),
        chats,
      };
    });
  },

  setTypingState: ({ chatId, senderId, isTyping }) => {
    if (!chatId && !senderId) return;

    const key = chatId || senderId;

    set((state) => ({
      typingByChatId: {
        ...state.typingByChatId,
        [key]: isTyping,
      },
    }));
  },

  upsertIncomingMessage: (messagePayload) => {
    const chatId = messagePayload.chatId?.toString();

    if (!chatId) return;

    const mappedMessage = mapMessageFromApi(messagePayload, getCurrentUserId());

    set((state) => {
      const existingMessages = state.messagesByChatId[chatId] || [];
      const messagesWithoutOptimistic = messagePayload.clientTempId
        ? existingMessages.filter((message) => message.id !== messagePayload.clientTempId)
        : existingMessages;
      const alreadyExists = messagesWithoutOptimistic.some(
        (message) => message.id === mappedMessage.id,
      );

      const messages = alreadyExists
        ? messagesWithoutOptimistic.map((message) =>
            message.id === mappedMessage.id ? mappedMessage : message,
          )
        : [...messagesWithoutOptimistic, mappedMessage];

      return {
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: messages,
        },
        chats: state.chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMessage: mappedMessage.content,
                lastMessageAt: mappedMessage.time,
              }
            : chat,
        ),
      };
    });
  },

  markMessageDelivered: ({ messageId, deliveredAt }) => {
    set((state) => ({
      messagesByChatId: Object.fromEntries(
        Object.entries(state.messagesByChatId).map(([chatId, messages]) => [
          chatId,
          messages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  deliveredAt,
                }
              : message,
          ),
        ]),
      ),
    }));
  },

  markMessageSeen: ({ messageId, seenAt }) => {
    set((state) => ({
      messagesByChatId: Object.fromEntries(
        Object.entries(state.messagesByChatId).map(([chatId, messages]) => [
          chatId,
          messages.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  seenAt,
                }
              : message,
          ),
        ]),
      ),
    }));
  },
}));
