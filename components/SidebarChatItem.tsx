import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Chat } from "@/hooks/useChats";
import { UseMutationResult } from "@tanstack/react-query";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface SidebarChatItemProps {
  chat: Chat;
  active: boolean;
  selectedProjectId: string | null;
  onSelect: () => void;
  onRenamed: () => void;
  updateChatTitle: UseMutationResult<
    void,
    Error,
    { chatId: string; title: string },
    unknown
  >;
  deleteChat: UseMutationResult<void, Error, string, unknown>;
}

export function SidebarChatItem({
  chat,
  active,
  selectedProjectId,
  onSelect,
  onRenamed,
  updateChatTitle,
  deleteChat,
}: SidebarChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  async function rename() {
    if (!selectedProjectId) return;
    if (title.trim() === chat.title) {
      setIsEditing(false);
      return;
    }
    await updateChatTitle.mutateAsync({
      chatId: chat.id,
      title: title.trim(),
    });
    setIsEditing(false);
    onRenamed();
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa chat này?")) {
      await deleteChat.mutateAsync(chat.id);
    }
  };

  return (
    <div
      className={`group relative text-sm px-2 py-2 rounded cursor-pointer flex items-center justify-between ${
        active ? "bg-accent" : "hover:bg-accent"
      }`}
      onClick={() => !isEditing && onSelect()}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") rename();
            if (e.key === "Escape") {
              setIsEditing(false);
              setTitle(chat.title);
            }
          }}
          onBlur={rename}
          className="h-7 text-sm"
        />
      ) : (
        <>
          <span className="flex-1 truncate">{chat.title}</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-48 p-2" side="right" align="start">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="size-3 mr-2" />
                    Đổi tên
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="size-3 mr-2" />
                    Xóa
                  </Button>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </>
      )}
    </div>
  );
}
