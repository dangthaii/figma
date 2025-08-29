import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Message } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { WebDemoPanel } from "@/components/WebDemoPanel";
import { WebDemoNotification } from "@/components/WebDemoNotification";
import { Monitor, X } from "lucide-react";
import {
  LoadingDots,
  ChatMessageSkeleton,
  TypingIndicator,
} from "@/components/ui/loading";

interface ChatAreaProps {
  messages: Message[];
  streamingText: string;
  isLoading: boolean;
  chatLoading?: boolean;
  projectId: string | null;
  chatId: string | null;
}

export function ChatArea({
  messages,
  streamingText,
  isLoading,
  chatLoading = false,
  projectId,
  chatId,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showWebDemoPanel, setShowWebDemoPanel] = useState(false);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streamingText]);

  return (
    <>
      <div className="flex-1 flex flex-col px-4 min-h-0">
        {/* Header with Web Demo button */}
        <div className="flex items-center justify-between py-4 border-b">
          <h1 className="text-xl font-semibold">Chat</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWebDemoPanel(true)}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Web Demos
          </Button>
        </div>

        {chatLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                Đang tải chat...
              </div>
            </div>
          </div>
        ) : !messages?.length && !streamingText ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                Hôm nay bạn có ý tưởng gì?
              </h2>
              <p className="text-muted-foreground">
                Hãy thử yêu cầu AI tạo một trang web demo cho bạn!
              </p>
            </div>
          </div>
        ) : null}

        <div
          className="flex-1 min-h-0 overflow-y-auto pb-32"
          ref={scrollContainerRef}
          data-scroll="messages"
        >
          <div className="w-full max-w-2xl mx-auto mt-6 space-y-4 px-2">
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
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Web Demo Panel */}
      <WebDemoPanel
        projectId={projectId}
        chatId={chatId}
        isVisible={showWebDemoPanel}
        onClose={() => setShowWebDemoPanel(false)}
      />

      {/* Web Demo Notification */}
      <WebDemoNotification
        projectId={projectId}
        chatId={chatId}
        onOpenPanel={() => setShowWebDemoPanel(true)}
      />
    </>
  );
}
