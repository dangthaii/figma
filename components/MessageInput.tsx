import { Button } from "@/components/ui/button";
import { Plus, Mic, Waves } from "lucide-react";

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  disabled?: boolean;
}

export function MessageInput({
  input,
  setInput,
  onSend,
  onNewChat,
  disabled = false,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className="sticky bottom-0 border-t p-4 bg-background">
      <div className="max-w-3xl mx-auto flex items-center gap-3 rounded-full border bg-background shadow-sm pl-4 pr-2 py-3 md:py-4">
        <button
          className="shrink-0 rounded-full size-8 flex items-center justify-center bg-accent text-foreground/80"
          aria-label="New chat"
          onClick={onNewChat}
        >
          <Plus className="size-4" />
        </button>
        <input
          className="flex-1 outline-none bg-transparent text-base md:text-lg placeholder:text-muted-foreground/70"
          placeholder="Hỏi bất kỳ điều gì"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="flex items-center gap-1.5 pr-1">
          <button
            className="p-2 rounded-full hover:bg-accent"
            aria-label="Voice input"
          >
            <Mic className="size-5 text-muted-foreground" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-accent"
            aria-label="Record"
          >
            <Waves className="size-5 text-muted-foreground" />
          </button>
          <Button
            className="ml-1"
            onClick={onSend}
            disabled={!input.trim() || disabled}
          >
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
}
