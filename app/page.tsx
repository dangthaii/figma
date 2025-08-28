"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { useProjects } from "@/hooks/useProjects";
import { useChats } from "@/hooks/useChats";
import { useChat } from "@/hooks/useChat";
import { useStreamingMessage } from "@/hooks/useStreamingMessage";
import { autoSelectFirstProject, autoSelectFirstChat } from "@/utils/chatUtils";

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [input, setInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const { projects } = useProjects();
  const { chats, createChat } = useChats(selectedProjectId);
  const { activeChat } = useChat(selectedProjectId, activeChatId);
  const { streamingText, isLoading, sendStreamingMessage } =
    useStreamingMessage();

  // Auto-select first project when available
  useEffect(() => {
    autoSelectFirstProject(projects, selectedProjectId, setSelectedProjectId);
  }, [projects, selectedProjectId]);

  // Auto-select first chat when available
  useEffect(() => {
    autoSelectFirstChat(chats, activeChatId, setActiveChatId);
  }, [chats, activeChatId]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (!activeChatId) {
      // Create new chat
      const newChat = await createChat.mutateAsync(input);
      if (newChat?.id) {
        setActiveChatId(newChat.id);
        await sendStreamingMessage(selectedProjectId, newChat.id, input);
      }
    } else {
      // Send message to existing chat
      await sendStreamingMessage(selectedProjectId, activeChatId, input);
    }
    setInput("");
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput("");
    requestAnimationFrame(() => {
      const inputElement = document.querySelector(
        'input[placeholder="Hỏi bất kỳ điều gì"]'
      ) as HTMLInputElement;
      inputElement?.focus();
    });
  };

  const hasProjects = (projects?.length || 0) > 0;

  return (
    <div className="h-screen grid grid-cols-[260px_1fr] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        setInput={setInput}
      />

      {/* Main chat area */}
      <main className="flex flex-col min-h-0 overflow-hidden">
        {!hasProjects ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Bạn chưa có project nào. Tạo project mới để bắt đầu.
            </div>
          </div>
        ) : (
          <>
            <ChatArea
              messages={activeChat?.messages || []}
              streamingText={streamingText}
              isLoading={isLoading}
            />
            <MessageInput
              input={input}
              setInput={setInput}
              onSend={handleSendMessage}
              onNewChat={handleNewChat}
              disabled={isLoading}
            />
          </>
        )}
      </main>
    </div>
  );
}
