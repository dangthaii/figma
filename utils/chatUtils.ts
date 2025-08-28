import { useQueryClient } from "@tanstack/react-query";

export function useChatUtils() {
  const queryClient = useQueryClient();

  const invalidateChatQueries = (selectedProjectId: string, chatId: string) => {
    queryClient.invalidateQueries({
      queryKey: ["chat", selectedProjectId, chatId],
    });
    queryClient.invalidateQueries({
      queryKey: ["chats", selectedProjectId],
    });
  };

  const invalidateProjectQueries = (selectedProjectId: string) => {
    queryClient.invalidateQueries({
      queryKey: ["projects"],
    });
    queryClient.invalidateQueries({
      queryKey: ["chats", selectedProjectId],
    });
  };

  return {
    invalidateChatQueries,
    invalidateProjectQueries,
  };
}

export function autoSelectFirstProject(
  projects: { id: string; name: string }[] | undefined,
  selectedProjectId: string | null,
  setSelectedProjectId: (id: string) => void
) {
  if (projects && projects.length > 0 && !selectedProjectId) {
    setSelectedProjectId(projects[0].id);
  }
}

export function autoSelectFirstChat(
  chats: { id: string; title: string }[] | undefined,
  activeChatId: string | null,
  setActiveChatId: (id: string | null) => void
) {
  if (!activeChatId && (chats?.length || 0) > 0) {
    setActiveChatId(chats?.[0]?.id || null);
  }
}
