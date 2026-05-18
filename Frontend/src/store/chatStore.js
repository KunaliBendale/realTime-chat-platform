import { create } from "zustand";
import {
  createOptimisticMessage,
  mapChatFromApi,
  mapMessageFromApi,
} from "../lib/chatMappers";
import { tokenStorage } from "../lib/tokenStorage";
import { chatService } from "../services/chatService";
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

export const useChatStore = create((set, get) => ({
  chats: [],
  selectedChatId: null,
  messagesByChatId: {},
  nextCursorByChatId: {},
  isUsingPreviewData: false,
  isChatsLoading: false,
  isMessagesLoading: false,
  actionLoading: null,
  error: null,

  clearError: () => set({ error: null }),

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
}));
