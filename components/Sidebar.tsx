import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarChatItem } from "@/components/SidebarChatItem";
import { useProjects } from "@/hooks/useProjects";
import { useChats } from "@/hooks/useChats";

interface SidebarProps {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  setInput: (input: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  selectedProjectId,
  setSelectedProjectId,
  activeChatId,
  setActiveChatId,
  setInput,
  onNewChat,
}: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [figmaLink, setFigmaLink] = useState("");

  const { projects, isLoading: projectsLoading, createProject } = useProjects();
  const {
    chats,
    isLoading: chatsLoading,
    updateChatTitle,
    deleteChat,
  } = useChats(selectedProjectId);

  const handleCreateProject = async () => {
    await createProject.mutateAsync({ name: projectName, figmaLink });
    setOpen(false);
    setProjectName("");
    setFigmaLink("");
  };

  return (
    <aside className="border-r flex flex-col min-h-0 overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Chats</div>
        <Button size="sm" variant="outline" onClick={onNewChat}>
          New chat
        </Button>
      </div>

      {/* Chats list */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {chatsLoading ? (
          // Show skeleton loading for chats
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="text-xs text-muted-foreground p-2">
            Chưa có chat nào.
          </div>
        ) : (
          chats.map((chat) => (
            <SidebarChatItem
              key={chat.id}
              chat={chat}
              active={activeChatId === chat.id}
              selectedProjectId={selectedProjectId}
              onSelect={() => setActiveChatId(chat.id)}
              onRenamed={() => {
                // Invalidation is handled in the hook
              }}
              updateChatTitle={updateChatTitle}
              deleteChat={deleteChat}
            />
          ))
        )}
      </div>

      {/* Project switcher */}
      <div className="p-3 border-t space-y-2">
        <div className="text-xs text-muted-foreground">Project</div>
        <div className="flex items-center gap-2">
          {projectsLoading ? (
            <div className="w-full h-10 bg-muted rounded-md animate-pulse"></div>
          ) : (
            <Select
              value={selectedProjectId || undefined}
              onValueChange={(v) => setSelectedProjectId(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Tạo project mới với link Figma để AI có ngữ cảnh.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Figma Q&A"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="figma">Link figma</Label>
                  <Input
                    id="figma"
                    value={figmaLink}
                    onChange={(e) => setFigmaLink(e.target.value)}
                    placeholder="https://www.figma.com/file/..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={
                      !projectName || !figmaLink || createProject.isPending
                    }
                  >
                    {createProject.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </aside>
  );
}
