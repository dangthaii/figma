"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";
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
import { Plus, Mic, Waves } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export default function Home() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [input, setInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: projects } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosClient.get("/projects");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post("/projects", {
        name: projectName,
        figmaLink,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setProjectName("");
      setFigmaLink("");
    },
  });

  const { data: chats } = useQuery<{ id: string; title: string }[]>({
    queryKey: ["chats", selectedProjectId],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      const res = await axiosClient.get(`/projects/${selectedProjectId}/chats`);
      return res.data.data || [];
    },
  });

  const hasProjects = (projects?.length || 0) > 0;

  const createFirstMessage = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) return null;
      const firstContent = input;
      const res = await axiosClient.post(
        `/projects/${selectedProjectId}/chats`,
        { content: firstContent }
      );
      return { chat: res.data.data, firstContent } as any;
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["chats", selectedProjectId] });
      const chatId = data?.chat?.id as string;
      if (chatId) {
        setActiveChatId(chatId);
        await sendMessage(data.firstContent, chatId);
      }
    },
  });

  const { data: activeChat } = useQuery<{
    id: string;
    title: string;
    messages: { id: string; role: string; content: string }[];
  }>({
    queryKey: ["chat", selectedProjectId, activeChatId],
    enabled: !!selectedProjectId && !!activeChatId,
    queryFn: async () => {
      const res = await axiosClient.get(
        `/projects/${selectedProjectId}/chats/${activeChatId}`
      );
      return res.data.data;
    },
  });

  async function sendMessage(message?: string, chatIdParam?: string) {
    const chatId = chatIdParam || activeChatId;
    if (!selectedProjectId || !chatId) return;
    const contentToSend = (message ?? input).trim();
    if (!contentToSend) return;
    setStreamingText("");

    const response = await fetch(
      `/api/projects/${selectedProjectId}/chats/${chatId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend }),
      }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj?.chunk) {
              buffer += obj.chunk as string;
              setStreamingText((prev) => prev + obj.chunk);
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    }

    setInput("");
    setStreamingText("");
    await queryClient.invalidateQueries({
      queryKey: ["chat", selectedProjectId, chatId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["chats", selectedProjectId],
    });
  }

  // Auto-select first chat when available
  useEffect(() => {
    if (!activeChatId && (chats?.length || 0) > 0) {
      setActiveChatId(chats?.[0]?.id || null);
    }
  }, [chats, activeChatId]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeChat?.messages, streamingText]);

  return (
    <div className="h-screen grid grid-cols-[260px_1fr] overflow-hidden">
      {/* Sidebar */}
      <aside className="border-r flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-medium">Chats</div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                New Project
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
                    onClick={() => createProject.mutate()}
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

        {/* Chats list */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {(!chats || chats.length === 0) && (
            <div className="text-xs text-muted-foreground p-2">
              Chưa có chat nào.
            </div>
          )}
          {chats?.map((c) => (
            <div
              key={c.id}
              className={`text-sm px-2 py-2 rounded cursor-pointer ${
                activeChatId === c.id ? "bg-accent" : "hover:bg-accent"
              }`}
              onClick={() => setActiveChatId(c.id)}
            >
              {c.title}
            </div>
          ))}
        </div>

        {/* Project switcher */}
        <div className="p-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground">Project</div>
          <Select
            value={selectedProjectId || undefined}
            onValueChange={(v) => setSelectedProjectId(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex flex-col min-h-0 overflow-hidden">
        {!hasProjects ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Bạn chưa có project nào. Tạo project mới để bắt đầu.
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col px-4 min-h-0">
            {!activeChat?.messages?.length && !streamingText && (
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
                {activeChat?.messages?.map((m) => (
                  <div
                    key={m.id}
                    className={`text-sm leading-6 ${
                      m.role === "assistant" ? "" : "text-foreground"
                    }`}
                  >
                    <div
                      className={`inline-block rounded-2xl px-4 py-2 ${
                        m.role === "assistant"
                          ? "bg-muted prose prose-sm dark:prose-invert max-w-none"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            pre: ({ node, ...props }) => (
                              <pre className="overflow-auto" {...props} />
                            ),
                            code: ({ node, inline, ...props }) => (
                              <code
                                className={inline ? "" : "block"}
                                {...props}
                              />
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        m.content
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
              </div>
            </div>
            <div className="sticky bottom-0 border-t p-4 bg-background">
              <div className="max-w-3xl mx-auto flex items-center gap-3 rounded-full border bg-background shadow-sm pl-4 pr-2 py-3 md:py-4">
                <button
                  className="shrink-0 rounded-full size-8 flex items-center justify-center bg-accent text-foreground/80"
                  aria-label="New chat"
                >
                  <Plus className="size-4" />
                </button>
                <input
                  className="flex-1 outline-none bg-transparent text-base md:text-lg placeholder:text-muted-foreground/70"
                  placeholder="Hỏi bất kỳ điều gì"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      if (!activeChatId) {
                        createFirstMessage.mutate();
                      } else {
                        sendMessage();
                      }
                    }
                  }}
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
                    onClick={() =>
                      !activeChatId
                        ? createFirstMessage.mutate()
                        : sendMessage()
                    }
                    disabled={!input.trim()}
                  >
                    Gửi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
