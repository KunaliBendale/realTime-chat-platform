import { useEffect, useMemo } from "react";
import { ChatActions } from "../components/chat/ChatActions";
import { ChatPanel } from "../components/chat/ChatPanel";
import { RecentChats } from "../components/chat/RecentChats";
import { dummyChats } from "../data/dummyChats";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

export function DashboardPage() {
  const token = useAuthStore((state) => state.token);
  const chats = useChatStore((state) => state.chats);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const messagesByChatId = useChatStore((state) => state.messagesByChatId);
  const isUsingPreviewData = useChatStore((state) => state.isUsingPreviewData);
  const isChatsLoading = useChatStore((state) => state.isChatsLoading);
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
  const actionLoading = useChatStore((state) => state.actionLoading);
  const error = useChatStore((state) => state.error);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const openConversation = useChatStore((state) => state.openConversation);
  const accessChat = useChatStore((state) => state.accessChat);
  const createGroup = useChatStore((state) => state.createGroup);
  const updateGroup = useChatStore((state) => state.updateGroup);
  const addUsersToGroup = useChatStore((state) => state.addUsersToGroup);
  const removeUsersFromGroup = useChatStore((state) => state.removeUsersFromGroup);
  const deleteGroup = useChatStore((state) => state.deleteGroup);
  const prepareOptimisticMessage = useChatStore(
    (state) => state.prepareOptimisticMessage,
  );

  useEffect(() => {
    fetchChats();
  }, [fetchChats, token]);

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

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#edf1f7] text-[#172033]">
      <div className="mx-auto flex h-full max-w-7xl flex-col border-x border-[#d9dee8] bg-white lg:flex-row">
        <div className="h-[360px] shrink-0 lg:h-full lg:w-[390px]">
          <RecentChats
            chats={visibleChats}
            selectedChat={selectedChat}
            selectedChatId={selectedChat?.id}
            isLoading={isChatsLoading}
            onSelectChat={openConversation}
            actionsSlot={
              <ChatActions
                key={selectedChat?.id || "no-chat"}
                selectedChat={selectedChat}
                actionLoading={actionLoading}
                hasToken={Boolean(token)}
                onAccessChat={accessChat}
                onCreateGroup={createGroup}
                onUpdateGroup={updateGroup}
                onAddUsers={addUsersToGroup}
                onRemoveUsers={removeUsersFromGroup}
                onDeleteGroup={deleteGroup}
              />
            }
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
            onPrepareOptimisticMessage={prepareOptimisticMessage}
          />
        </div>
      </div>
    </main>
  );
}
