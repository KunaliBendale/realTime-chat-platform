import { useEffect, useMemo, useState } from "react";
import { ChatActions } from "../components/chat/ChatActions";
import { ChatPanel } from "../components/chat/ChatPanel";
import { RecentChats } from "../components/chat/RecentChats";
import { dummyChats } from "../data/dummyChats";
import { getSocketRecipientId } from "../lib/chatMappers";
import { socketService } from "../services/socketService";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

export function DashboardPage() {
  const token = useAuthStore((state) => state.token);
  const chats = useChatStore((state) => state.chats);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const contacts = useChatStore((state) => state.contacts);
  const messagesByChatId = useChatStore((state) => state.messagesByChatId);
  const isUsingPreviewData = useChatStore((state) => state.isUsingPreviewData);
  const isChatsLoading = useChatStore((state) => state.isChatsLoading);
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
  const isContactsLoading = useChatStore((state) => state.isContactsLoading);
  const actionLoading = useChatStore((state) => state.actionLoading);
  const error = useChatStore((state) => state.error);
  const socketStatus = useChatStore((state) => state.socketStatus);
  const typingByChatId = useChatStore((state) => state.typingByChatId);
  const userSearchResults = useChatStore((state) => state.userSearchResults);
  const isUserSearchLoading = useChatStore((state) => state.isUserSearchLoading);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchContacts = useChatStore((state) => state.fetchContacts);
  const openConversation = useChatStore((state) => state.openConversation);
  const accessChat = useChatStore((state) => state.accessChat);
  const addContact = useChatStore((state) => state.addContact);
  const searchUsers = useChatStore((state) => state.searchUsers);
  const createGroup = useChatStore((state) => state.createGroup);
  const prepareOptimisticMessage = useChatStore(
    (state) => state.prepareOptimisticMessage,
  );
  const sendMessageWithRest = useChatStore((state) => state.sendMessageWithRest);
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?._id || user?.id;
  const [activeChatAction, setActiveChatAction] = useState(null);

  useEffect(() => {
    fetchChats();
    fetchContacts();
  }, [fetchChats, fetchContacts, token]);

  useEffect(() => {
    if (!selectedChatId && dummyChats[0]?.id) {
      openConversation(dummyChats[0].id);
    }
  }, [openConversation, selectedChatId]);

  const visibleChats = chats.length ? chats : dummyChats;
  const selectedChat = useMemo(
    () =>
      visibleChats.find((chat) => chat.id === selectedChatId) ||
      visibleChats[0] ||
      null,
    [selectedChatId, visibleChats],
  );
  const messages = useMemo(
    () => {
      if (!selectedChat) return [];

      const cachedMessages = messagesByChatId[selectedChat.id];

      if (!chats.length && cachedMessages?.length) {
        return [...(selectedChat.messages || []), ...cachedMessages];
      }

      return cachedMessages || selectedChat.messages || [];
    },
    [chats.length, messagesByChatId, selectedChat],
  );

  useEffect(() => {
    if (!selectedChat || !token || !chats.length) return;

    socketService.joinChat({
      chatId: selectedChat.id,
      receiverId: getSocketRecipientId(selectedChat, currentUserId),
    });
  }, [chats.length, currentUserId, selectedChat, token]);

  const isTyping = Boolean(
    selectedChat &&
      (typingByChatId[selectedChat.id] ||
        typingByChatId[getSocketRecipientId(selectedChat, currentUserId)]),
  );

  const handleSendMessage = ({ chat, content, image, clientTempId }) => {
    const sent = socketService.sendMessage({
      chatId: chat.isGroup ? chat.id : undefined,
      receiverId: getSocketRecipientId(chat, currentUserId),
      content,
      image,
      clientTempId,
    });

    if (!sent && chats.length) {
      sendMessageWithRest({
        chatId: chat.id,
        receiverId: getSocketRecipientId(chat, currentUserId),
        content,
        image,
        clientTempId,
      });
    }

    return sent;
  };

  const handleTyping = (chat) => {
    socketService.sendTyping({
      chatId: chat.isGroup ? chat.id : undefined,
      receiverId: getSocketRecipientId(chat, currentUserId),
    });
  };

  const handleStopTyping = (chat) => {
    socketService.stopTyping({
      chatId: chat.isGroup ? chat.id : undefined,
      receiverId: getSocketRecipientId(chat, currentUserId),
    });
  };

  return (
    <main className="h-full overflow-hidden bg-[#edf1f7] text-[#172033]">
      <div className="mx-auto flex h-full max-w-7xl flex-col border-x border-[#d9dee8] bg-white lg:flex-row">
        <div className="h-[360px] shrink-0 lg:h-full lg:w-[390px]">
          <RecentChats
            chats={visibleChats}
            selectedChat={selectedChat}
            selectedChatId={selectedChat?.id}
            isLoading={isChatsLoading}
            contacts={contacts}
            isContactsLoading={isContactsLoading}
            onSelectChat={openConversation}
            onStartContactChat={accessChat}
            onOpenAction={setActiveChatAction}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {(error || isUsingPreviewData) && (
            <div className="border-b border-[#fde68a] bg-[#fffbeb] px-4 py-2 text-xs text-[#92400e]">
              {error || "Preview data is shown until backend chats are loaded."}
            </div>
          )}

          <ChatPanel
            chat={selectedChat}
            messages={messages}
            isLoading={isMessagesLoading}
            socketStatus={socketStatus}
            isTyping={isTyping}
            onPrepareOptimisticMessage={prepareOptimisticMessage}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
          />
        </div>
      </div>

      <ChatActions
        activeAction={activeChatAction}
        actionLoading={actionLoading}
        hasToken={Boolean(token)}
        savedContacts={contacts}
        onClose={() => setActiveChatAction(null)}
        onAddContact={addContact}
        onAccessChat={accessChat}
        onSearchUsers={searchUsers}
        userSearchResults={userSearchResults}
        isUserSearchLoading={isUserSearchLoading}
        onCreateGroup={createGroup}
      />
    </main>
  );
}
