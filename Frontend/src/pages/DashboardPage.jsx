import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatActions } from "../components/chat/ChatActions";
import { ChatPanel } from "../components/chat/ChatPanel";
import { EmptyChatState } from "../components/chat/EmptyChatState";
import { MediaViewerModal } from "../components/chat/MediaViewerModal";
import { PostLoginLoader } from "../components/chat/PostLoginLoader";
import { RecentChats } from "../components/chat/RecentChats";
import { SettingsModal } from "../components/chat/SettingsModal";
import { ProfileModal } from "../components/profile/ProfileModal";
import { dummyChats } from "../data/dummyChats";
import { useIsMobile } from "../hooks/useMediaQuery";
import { getOtherParticipant, getSocketRecipientId } from "../lib/chatMappers";
import { profileService } from "../services/profileService";
import { socketService } from "../services/socketService";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";

export function DashboardPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const updateProfileImage = useAuthStore((state) => state.updateProfileImage);
  const logout = useAuthStore((state) => state.logout);
  const currentUserId = user?._id || user?.id;

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
  const onlineUserIds = useChatStore((state) => state.onlineUserIds);
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
  const prepareOptimisticMessage = useChatStore((state) => state.prepareOptimisticMessage);
  const sendMessageWithRest = useChatStore((state) => state.sendMessageWithRest);

  const [activeChatAction, setActiveChatAction] = useState(null);
  const [profileContext, setProfileContext] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showBootstrap, setShowBootstrap] = useState(true);

  useEffect(() => {
    fetchChats();
    fetchContacts();
  }, [fetchChats, fetchContacts, token]);

  useEffect(() => {
    if (!isChatsLoading && !isContactsLoading) {
      const timer = window.setTimeout(() => setShowBootstrap(false), 600);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isChatsLoading, isContactsLoading]);

  useEffect(() => {
    if (!token && !selectedChatId && dummyChats[0]?.id) {
      openConversation(dummyChats[0].id);
    }
  }, [openConversation, selectedChatId, token]);

  const visibleChats = useMemo(() => {
    if (chats.length) return chats;
    if (!token) return dummyChats;
    return [];
  }, [chats, token]);
  const selectedChat = useMemo(
    () =>
      visibleChats.find((chat) => chat.id === selectedChatId) || visibleChats[0] || null,
    [selectedChatId, visibleChats],
  );

  const hasLoadedSelectedMessages = selectedChat
    ? Boolean(messagesByChatId[selectedChat.id])
    : false;

  useEffect(() => {
    if (!token || !chats.length || !selectedChat?.id || hasLoadedSelectedMessages) {
      return;
    }

    openConversation(selectedChat.id);
  }, [
    chats.length,
    hasLoadedSelectedMessages,
    openConversation,
    selectedChat?.id,
    token,
  ]);

  const messages = useMemo(() => {
    if (!selectedChat) return [];

    const cachedMessages = messagesByChatId[selectedChat.id];

    if (!chats.length && cachedMessages?.length) {
      return [...(selectedChat.messages || []), ...cachedMessages];
    }

    return cachedMessages || selectedChat.messages || [];
  }, [chats.length, messagesByChatId, selectedChat]);

  const recipientId = selectedChat
    ? getSocketRecipientId(selectedChat, currentUserId)
    : null;
  const isChatOnline = recipientId ? onlineUserIds.includes(recipientId.toString()) : false;

  const isTyping = Boolean(
    selectedChat &&
      (typingByChatId[selectedChat.id] ||
        typingByChatId[recipientId]),
  );

  useEffect(() => {
    if (profileContext === "own") {
      setProfileUser(user);
    }
  }, [profileContext, user]);

  useEffect(() => {
    if (!selectedChat || !token || !chats.length) return;

    socketService.joinChat({
      chatId: selectedChat.id,
      receiverId: recipientId,
    });
  }, [chats.length, recipientId, selectedChat, token]);

  const handleSelectChat = (chatId) => {
    openConversation(chatId);
    if (isMobile) setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

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

  const clearProfileFeedback = () => {
    setProfileMessage("");
    setProfileError("");
  };

  const handleOpenOwnProfile = async () => {
    setProfileContext("own");
    setProfileUser(user);
    clearProfileFeedback();

    if (!token) return;

    setIsProfileLoading(true);
    const result = await refreshProfile();
    if (result.success && result.user) {
      setProfileUser(result.user);
    } else if (!result.success) {
      setProfileError("Unable to load profile right now");
    }
    setIsProfileLoading(false);
  };

  const handleOpenChatProfile = async () => {
    if (!selectedChat) return;

    clearProfileFeedback();

    if (selectedChat.isGroup) {
      setProfileContext("group");
      setProfileUser({
        name: selectedChat.name,
        profilePic: selectedChat.profilePic,
        status: selectedChat.role,
        createdAt: selectedChat.raw?.createdAt,
      });
      return;
    }

    const participant =
      getOtherParticipant(selectedChat.raw || selectedChat, currentUserId) || {
        name: selectedChat.name,
        email: selectedChat.role,
        profilePic: selectedChat.profilePic,
        status: selectedChat.status,
      };

    const participantId = participant?._id || participant?.id;

    setProfileContext("contact");
    setProfileUser(participant);

    if (!token || !participantId) return;

    setIsProfileLoading(true);
    try {
      const fullProfile = await profileService.getUserProfile(participantId);
      setProfileUser(fullProfile || participant);
    } catch {
      setProfileError("Unable to load profile right now");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleCloseProfile = () => {
    setProfileContext(null);
    setProfileUser(null);
    setIsProfileLoading(false);
    setIsProfileSaving(false);
    setIsProfileUploading(false);
    clearProfileFeedback();
  };

  const handleSaveProfile = async (payload) => {
    if (!payload.name) {
      setProfileError("Name is required");
      return;
    }

    if (!/^\d{10}$/.test(payload.mobile)) {
      setProfileError("Mobile number must be 10 digits");
      return;
    }

    setIsProfileSaving(true);
    clearProfileFeedback();

    const result = await updateProfile(payload);

    if (result.success) {
      setProfileUser(result.user);
      setIsProfileSaving(false);
      handleCloseProfile();
    } else {
      setProfileError(result.message || "Unable to update profile right now");
      setIsProfileSaving(false);
    }
  };

  const handleUploadProfileImage = async (file) => {
    setIsProfileUploading(true);
    clearProfileFeedback();

    const result = await updateProfileImage(file);

    if (result.success) {
      setProfileUser(result.user);
      setProfileMessage("Profile image updated successfully");
    } else {
      setProfileError("Unable to update profile image right now");
    }

    setIsProfileUploading(false);
  };

  const handleProfileLogout = () => {
    logout();
    handleCloseProfile();
    navigate("/login", { replace: true });
  };

  const showSidebar = !isMobile || !mobileShowChat;
  const showChatPanel = !isMobile || mobileShowChat;
  const isOwnProfile = profileContext === "own";
  const isGroupProfile = profileContext === "group";

  return (
    <>
      <PostLoginLoader isVisible={showBootstrap && Boolean(token)} userName={user?.name} />

      <main className="flex h-full min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {showSidebar ? (
            <motion.div
              key="sidebar"
              className="h-full w-full shrink-0 lg:w-[380px] xl:w-[400px]"
              initial={isMobile ? { x: -24, opacity: 0 } : false}
              animate={{ x: 0, opacity: 1 }}
              exit={isMobile ? { x: -24, opacity: 0 } : undefined}
              transition={{ duration: 0.25 }}
            >
              <RecentChats
                chats={visibleChats}
                selectedChatId={selectedChat?.id}
                contacts={contacts}
                onlineUserIds={onlineUserIds}
                isLoading={isChatsLoading}
                isContactsLoading={isContactsLoading}
                onSelectChat={handleSelectChat}
                onStartContactChat={accessChat}
                onOpenAction={setActiveChatAction}
                onOpenSettings={() => setShowSettings(true)}
                onOpenOwnProfile={handleOpenOwnProfile}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {(error || isUsingPreviewData) && (
            <motion.div
              className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error || "Preview data is shown until backend chats are loaded."}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {showChatPanel ? (
              <motion.div
                key={selectedChat?.id || "empty"}
                className="flex min-h-0 flex-1 flex-col"
                initial={isMobile ? { x: 24, opacity: 0 } : { opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={isMobile ? { x: 24, opacity: 0 } : { opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {selectedChat ? (
                  <ChatPanel
                    chat={selectedChat}
                    messages={messages}
                    isLoading={isMessagesLoading}
                    isTyping={isTyping}
                    isOnline={isChatOnline}
                    showBack={isMobile}
                    onBack={handleBackToList}
                    onOpenProfile={handleOpenChatProfile}
                    onOpenSettings={() => setShowSettings(true)}
                    onImageClick={setMediaPreview}
                    onPrepareOptimisticMessage={prepareOptimisticMessage}
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    onStopTyping={handleStopTyping}
                  />
                ) : (
                  <EmptyChatState onStartChat={() => setActiveChatAction("directChat")} />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      </main>

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

      <ProfileModal
        isOpen={Boolean(profileContext)}
        onClose={handleCloseProfile}
        user={profileUser}
        isOwn={isOwnProfile}
        isGroup={isGroupProfile}
        isOnline={isChatOnline}
        membersCount={selectedChat?.users?.length || selectedChat?.raw?.users?.length || 0}
        isLoading={isProfileLoading}
        isSaving={isProfileSaving}
        isUploading={isProfileUploading}
        message={profileMessage}
        error={profileError}
        onSave={handleSaveProfile}
        onUploadImage={handleUploadProfileImage}
        onFileError={setProfileError}
        onLogout={handleProfileLogout}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        socketStatus={socketStatus}
      />

      <MediaViewerModal media={mediaPreview} onClose={() => setMediaPreview(null)} />
    </>
  );
}
