import { useMemo, useState } from "react";
import { ChatPanel } from "../components/chat/ChatPanel";
import { RecentChats } from "../components/chat/RecentChats";
import { dummyChats } from "../data/dummyChats";

export function DashboardPage() {
  const [selectedChatId, setSelectedChatId] = useState(dummyChats[0].id);
  const selectedChat = useMemo(
    () => dummyChats.find((chat) => chat.id === selectedChatId) || dummyChats[0],
    [selectedChatId],
  );

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#edf1f7] text-[#172033]">
      <div className="mx-auto flex h-full max-w-7xl flex-col border-x border-[#d9dee8] bg-white lg:flex-row">
        <div className="h-[258px] shrink-0 lg:h-full lg:w-[360px]">
          <RecentChats
            chats={dummyChats}
            selectedChatId={selectedChat.id}
            onSelectChat={setSelectedChatId}
          />
        </div>

        <ChatPanel chat={selectedChat} />
      </div>
    </main>
  );
}
