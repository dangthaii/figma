import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Message } from "@/hooks/useChat";

interface ChatAreaProps {
  messages: Message[];
  streamingText: string;
  isLoading: boolean;
}

export function ChatArea({
  messages,
  streamingText,
  isLoading,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingText]);

  return (
    <div className="flex-1 flex flex-col px-4 min-h-0">
      {!messages?.length && !streamingText && (
        <h1 className="text-3xl md:text-4xl font-semibold my-8 text-center">
          Hôm nay bạn có ý tưởng gì?
        </h1>
      )}
      <div
        className="flex-1 min-h-0 overflow-y-auto pb-32"
        ref={scrollContainerRef}
        data-scroll="messages"
      >
        <div className="w-full max-w-3xl mx-auto mt-6 space-y-4 px-2">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`text-sm leading-6 ${
                message.role === "assistant" ? "" : "text-foreground"
              }`}
            >
              <div
                className={`inline-block rounded-2xl px-4 py-2 ${
                  message.role === "assistant"
                    ? "bg-muted prose prose-sm dark:prose-invert max-w-none"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre: ({ ...props }) => (
                        <pre className="overflow-auto" {...props} />
                      ),
                      code: ({
                        inline,
                        ...props
                      }: {
                        inline?: boolean;
                        [key: string]: unknown;
                      }) => (
                        <code className={inline ? "" : "block"} {...props} />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {streamingText && (
            <div className="text-sm leading-6">
              <div className="inline-block rounded-2xl px-4 py-2 bg-muted prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {streamingText}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {isLoading && !streamingText && (
            <div className="text-sm leading-6">
              <div className="inline-block rounded-2xl px-4 py-2 bg-muted prose prose-sm dark:prose-invert max-w-none">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
