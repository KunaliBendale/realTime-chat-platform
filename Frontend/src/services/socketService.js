import { io } from "socket.io-client";
import { BACKEND_BASE_URL } from "../config/env";

const SOCKET_EVENTS = {
  connect: "connect",
  disconnect: "disconnect",
  connectError: "connect_error",
  receiveMessage: "receiveMessage",
  conversationUpdated: "conversationUpdated",
  onlineUsers: "onlineUsers",
  userStatus: "userStatus",
  typing: "typing",
  stopTyping: "stopTyping",
  messageDelivered: "messageDelivered",
  messageSeen: "messageSeen",
  chatJoined: "chatJoined",
  socketError: "socketError",
};

class SocketService {
  socket = null;

  token = null;

  listenerRegistry = new Map();

  connect(token) {
    if (!token) return null;

    if (this.socket?.connected && this.token === token) {
      return this.socket;
    }

    if (this.socket && this.token !== token) {
      this.disconnect();
    }

    this.token = token;
    this.socket = io(BACKEND_BASE_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    this.restoreListeners();

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.token = null;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }

  on(event, handler) {
    if (!this.listenerRegistry.has(event)) {
      this.listenerRegistry.set(event, new Set());
    }

    const handlers = this.listenerRegistry.get(event);

    if (handlers.has(handler)) {
      return () => this.off(event, handler);
    }

    handlers.add(handler);

    if (this.socket) {
      this.socket.off(event, handler);
      this.socket.on(event, handler);
    }

    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.listenerRegistry.get(event);

    if (handlers) {
      handlers.delete(handler);

      if (!handlers.size) {
        this.listenerRegistry.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  removeRegisteredListeners() {
    this.listenerRegistry.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket?.off(event, handler);
      });
    });
    this.listenerRegistry.clear();
  }

  restoreListeners() {
    this.listenerRegistry.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket.off(event, handler);
        this.socket.on(event, handler);
      });
    });
  }

  emit(event, payload, ack) {
    if (!this.socket?.connected) {
      return false;
    }

    this.socket.emit(event, payload, ack);
    return true;
  }

  joinChat({ chatId, receiverId }) {
    return this.emit("joinChat", { chatId, receiverId });
  }

  sendMessage({ chatId, receiverId, content, image, clientTempId }) {
    return this.emit("sendMessage", {
      chatId,
      receiverId,
      content,
      image,
      clientTempId,
    });
  }

  sendTyping({ chatId, receiverId }) {
    return this.emit("typing", { chatId, receiverId });
  }

  stopTyping({ chatId, receiverId }) {
    return this.emit("stopTyping", { chatId, receiverId });
  }

  markDelivered(messageId) {
    return this.emit("messageDelivered", { messageId });
  }

  markSeen(messageId) {
    return this.emit("messageSeen", { messageId });
  }

  markMessagesSeen({ chatId, messageIds }) {
    return this.emit("messagesSeen", { chatId, messageIds });
  }
}

export const socketEvents = SOCKET_EVENTS;
export const socketService = new SocketService();
