import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, X } from "lucide-react";

interface WebDemoNotificationProps {
  projectId: string | null;
  chatId: string | null;
  onOpenPanel: () => void;
}

export function WebDemoNotification({
  projectId,
  chatId,
  onOpenPanel,
}: WebDemoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!projectId || !chatId) return;

    // Check for new web demos every 10 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/chats/${chatId}/web-demo`
        );
        if (response.ok) {
          const data = await response.json();
          const count = data.webDemos?.length || 0;

          if (count > 0 && !isVisible) {
            setNotificationCount(count);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to check for web demos:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [projectId, chatId, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Web Demo Generated!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {notificationCount} demo{notificationCount > 1 ? "s" : ""}{" "}
              available for this chat
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => {
                  onOpenPanel();
                  setIsVisible(false);
                }}
              >
                View Demos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
