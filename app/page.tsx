"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { useProjects } from "@/hooks/useProjects";
import { useChats } from "@/hooks/useChats";
import { useChat } from "@/hooks/useChat";
import { useStreamingMessage } from "@/hooks/useStreamingMessage";
import { autoSelectFirstProject, autoSelectFirstChat } from "@/utils/chatUtils";
import { AuthGuard } from "@/components/AuthGuard";

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [input, setInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  const { projects, isLoading: projectsLoading } = useProjects();
  const {
    chats,
    createChat,
    isLoading: chatsLoading,
  } = useChats(selectedProjectId);
  const { activeChat, isLoading: chatLoading } = useChat(
    selectedProjectId,
    activeChatId
  );
  const { streamingText, isLoading, sendStreamingMessage } =
    useStreamingMessage();

  // Auto-select first project when available
  useEffect(() => {
    autoSelectFirstProject(projects, selectedProjectId, setSelectedProjectId);
  }, [projects, selectedProjectId]);

  // Auto-select first chat when available (but not when creating new chat)
  useEffect(() => {
    if (!isCreatingNewChat) {
      autoSelectFirstChat(chats, activeChatId, setActiveChatId);
    }
  }, [chats, activeChatId, isCreatingNewChat]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    if (!activeChatId) {
      // Create new chat
      const newChat = await createChat.mutateAsync(input);
      if (newChat?.id) {
        setActiveChatId(newChat.id);
        setIsCreatingNewChat(false); // Reset the flag
        await sendStreamingMessage(selectedProjectId, newChat.id, input);
      }
    } else {
      // Send message to existing chat
      await sendStreamingMessage(selectedProjectId, activeChatId, input);
    }
    setInput("");
  }, [
    input,
    activeChatId,
    selectedProjectId,
    createChat,
    sendStreamingMessage,
    setInput,
  ]);

  const handleNewChat = useCallback(() => {
    setIsCreatingNewChat(true); // Set flag to prevent auto-selection
    setActiveChatId(null);
    setInput("");
    requestAnimationFrame(() => {
      const inputElement = document.querySelector(
        'input[placeholder="Hỏi bất kỳ điều gì"]'
      ) as HTMLInputElement;
      inputElement?.focus();
    });
  }, [setActiveChatId, setInput]);

  const hasProjects = (projects?.length || 0) > 0;

  return (
    <AuthGuard>
      <div className="h-screen grid grid-cols-[260px_1fr] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          setInput={setInput}
          onNewChat={handleNewChat}
        />

        {/* Main chat area */}
        <main className="flex flex-col min-h-0 overflow-hidden">
          {projectsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-muted-foreground">
                  Đang tải projects...
                </div>
              </div>
            </div>
          ) : !hasProjects ? (
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
                chatLoading={chatLoading}
                projectId={selectedProjectId}
                chatId={activeChatId}
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
    </AuthGuard>
  );
}
