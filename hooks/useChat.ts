import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";

export interface Message {
  id: string;
  role: string;
  content: string;
}

export interface ChatData {
  id: string;
  title: string;
  messages: Message[];
}

export function useChat(
  selectedProjectId: string | null,
  activeChatId: string | null
) {
  const queryClient = useQueryClient();

  const { data: activeChat } = useQuery<ChatData>({
    queryKey: ["chat", selectedProjectId, activeChatId],
    enabled: !!selectedProjectId && !!activeChatId,
    queryFn: async () => {
      const res = await axiosClient.get(
        `/projects/${selectedProjectId}/chats/${activeChatId}`
      );
      return res.data.data;
    },
  });

  const invalidateChat = () => {
    if (selectedProjectId && activeChatId) {
      queryClient.invalidateQueries({
        queryKey: ["chat", selectedProjectId, activeChatId],
      });
      queryClient.invalidateQueries({
        queryKey: ["chats", selectedProjectId],
      });
    }
  };

  return {
    activeChat,
    invalidateChat,
  };
}
