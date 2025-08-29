import { Button } from "@/components/ui/button";
import { Plus, Mic, Waves, Loader2 } from "lucide-react";
import { useCallback, useRef, useEffect, memo } from "react";
import { useInputDebounce } from "@/hooks/useInputDebounce";

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  onNewChat: () => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({
  input,
  setInput,
  onSend,
  onNewChat,
  disabled = false,
}: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { localValue, handleChange } = useInputDebounce(input, 100, setInput);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && localValue.trim() && !disabled) {
        e.preventDefault();
        onSend();
      }
    },
    [localValue, onSend, disabled]
  );

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="sticky bottom-0 border-t p-4 bg-background">
      <div className="max-w-3xl mx-auto flex items-center gap-3 rounded-full border bg-background shadow-sm pl-4 pr-2 py-3 md:py-4">
        <button
          className="shrink-0 rounded-full size-8 flex items-center justify-center bg-accent text-foreground/80 hover:bg-accent/80 transition-colors"
          aria-label="New chat"
          onClick={onNewChat}
          type="button"
        >
          <Plus className="size-4" />
        </button>
        <input
          ref={inputRef}
          className="flex-1 outline-none bg-transparent text-base md:text-lg placeholder:text-muted-foreground/70 selection:bg-primary/20"
          placeholder="Hỏi bất kỳ điều gì"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
        />
        <div className="flex items-center gap-1.5 pr-1">
          <button
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Voice input"
            type="button"
          >
            <Mic className="h-5 text-muted-foreground" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Record"
            type="button"
          >
            <Waves className="h-5 text-muted-foreground" />
          </button>
          <Button
            className="ml-1"
            onClick={onSend}
            disabled={!localValue.trim() || disabled}
            type="button"
          >
            {disabled ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              "Gửi"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
