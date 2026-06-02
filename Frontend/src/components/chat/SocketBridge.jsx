import { useEffect } from "react";
import { socketEvents, socketService } from "../../services/socketService";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

export function SocketBridge() {
  const token = useAuthStore((state) => state.token);
  const setSocketStatus = useChatStore((state) => state.setSocketStatus);
  const setOnlineUsers = useChatStore((state) => state.setOnlineUsers);
  const setUserStatus = useChatStore((state) => state.setUserStatus);
  const setTypingState = useChatStore((state) => state.setTypingState);
  const upsertIncomingMessage = useChatStore((state) => state.upsertIncomingMessage);
  const markMessageDelivered = useChatStore((state) => state.markMessageDelivered);
  const markMessageSeen = useChatStore((state) => state.markMessageSeen);
  const handleSocketError = useChatStore((state) => state.handleSocketError);

  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      setSocketStatus("disconnected");
      return undefined;
    }

    socketService.connect(token);

    const cleanups = [
      socketService.on(socketEvents.connect, () => setSocketStatus("connected")),
      socketService.on(socketEvents.disconnect, () => setSocketStatus("disconnected")),
      socketService.on(socketEvents.connectError, (error) => {
        setSocketStatus(`error: ${error.message}`);
      }),
      socketService.on(socketEvents.receiveMessage, upsertIncomingMessage),
      socketService.on(socketEvents.conversationUpdated, upsertIncomingMessage),
      socketService.on(socketEvents.onlineUsers, setOnlineUsers),
      socketService.on(socketEvents.userStatus, setUserStatus),
      socketService.on(socketEvents.typing, (payload) =>
        setTypingState({ ...payload, isTyping: true }),
      ),
      socketService.on(socketEvents.stopTyping, (payload) =>
        setTypingState({ ...payload, isTyping: false }),
      ),
      socketService.on(socketEvents.messageDelivered, markMessageDelivered),
      socketService.on(socketEvents.messageSeen, markMessageSeen),
      socketService.on(socketEvents.socketError, (error) => {
        setSocketStatus(`error: ${error.message || "socket error"}`);
        handleSocketError(error);
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [
    markMessageDelivered,
    markMessageSeen,
    setOnlineUsers,
    setSocketStatus,
    setTypingState,
    setUserStatus,
    handleSocketError,
    token,
    upsertIncomingMessage,
  ]);

  return null;
}
