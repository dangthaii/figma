import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";

export interface Chat {
  id: string;
  title: string;
}

export function useChats(selectedProjectId: string | null) {
  const queryClient = useQueryClient();

  const { data: chats } = useQuery<Chat[]>({
    queryKey: ["chats", selectedProjectId],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      const res = await axiosClient.get(`/projects/${selectedProjectId}/chats`);
      return res.data.data || [];
    },
  });

  const createChat = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedProjectId) return null;
      const res = await axiosClient.post(
        `/projects/${selectedProjectId}/chats`,
        { content }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats", selectedProjectId] });
    },
  });

  const updateChatTitle = useMutation({
    mutationFn: async ({
      chatId,
      title,
    }: {
      chatId: string;
      title: string;
    }) => {
      if (!selectedProjectId) return;
      await fetch(`/api/projects/${selectedProjectId}/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats", selectedProjectId] });
    },
  });

  const deleteChat = useMutation({
    mutationFn: async (chatId: string) => {
      if (!selectedProjectId) return;
      await fetch(`/api/projects/${selectedProjectId}/chats/${chatId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats", selectedProjectId] });
    },
  });

  return {
    chats,
    createChat,
    updateChatTitle,
    deleteChat,
  };
}
