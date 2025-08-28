import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MoreVertical } from "lucide-react";
import { Chat } from "@/hooks/useChats";
import { UseMutationResult } from "@tanstack/react-query";

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
}

export function SidebarChatItem({
  chat,
  active,
  selectedProjectId,
  onSelect,
  onRenamed,
  updateChatTitle,
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
            <button
              className="p-1 rounded hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
