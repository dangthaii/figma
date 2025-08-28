import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useStreamingMessage() {
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const addOptimisticMessage = (
    selectedProjectId: string | null,
    chatId: string | null,
    content: string
  ) => {
    const optimisticUserMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData(
      ["chat", selectedProjectId, chatId],
      (oldData: unknown) => {
        if (!oldData || typeof oldData !== "object") return oldData;
        const data = oldData as { messages?: unknown[] };
        return {
          ...data,
          messages: [...(data.messages || []), optimisticUserMessage],
        };
      }
    );
  };

  const sendStreamingMessage = async (
    selectedProjectId: string | null,
    chatId: string | null,
    content: string
  ) => {
    if (!selectedProjectId || !chatId) return;
    const contentToSend = content.trim();
    if (!contentToSend) return;

    // Add optimistic update
    addOptimisticMessage(selectedProjectId, chatId, contentToSend);

    setStreamingText("");
    setIsLoading(true);

    const response = await fetch(
      `/api/projects/${selectedProjectId}/chats/${chatId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend }),
      }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj?.chunk) {
              buffer += obj.chunk as string;
              setStreamingText((prev) => prev + obj.chunk);
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    }

    setIsLoading(false);
    setStreamingText("");

    // Invalidate queries to get fresh data
    await queryClient.invalidateQueries({
      queryKey: ["chat", selectedProjectId, chatId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["chats", selectedProjectId],
    });
  };

  return {
    streamingText,
    isLoading,
    sendStreamingMessage,
  };
}
