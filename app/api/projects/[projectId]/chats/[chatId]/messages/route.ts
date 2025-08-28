import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/utils/auth";
import { createGeminiStream } from "@/lib/gemini";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; chatId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { projectId, chatId } = await params;
  const { content } = await request.json();
  if (!content || typeof content !== "string") {
    return new Response(JSON.stringify({ message: "Missing content" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      projectId,
      project: { ownerId: session.user.id },
    },
    select: {
      id: true,
      messages: true,
      project: { select: { context: true, name: true } },
      title: true,
    },
  });

  if (!chat) {
    return new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    contextAttached: !!chat.project?.context,
  } as const;

  // Save user message first
  await prisma.chat.update({
    where: { id: chat.id },
    data: {
      messages: [...((chat.messages as any[]) || []), userMessage] as any,
    },
  });

  const history = ((chat.messages as any[]) || [])
    .map(
      (m) => `${m.role === "assistant" ? "ASSISTANT" : "USER"}: ${m.content}`
    )
    .join("\n");

  const contextText = chat.project?.context
    ? `DỮ LIỆU NGỮ CẢNH FIGMA (JSON):\n${JSON.stringify(
        chat.project.context
      ).slice(0, 150000)}`
    : "KHÔNG CÓ NGỮ CẢNH FIGMA. Trả lời chung dựa trên kinh nghiệm về Figma.";

  const prompt = `Bạn là trợ lý AI chuyên về Figma cho project "${
    chat.project?.name ?? "Unknown"
  }".
${contextText}

NGUYÊN TẮC:
- Dựa vào ngữ cảnh nếu có, trích dẫn chi tiết phù hợp.
- Ngắn gọn, rõ ràng, có thể hướng dẫn theo bước.

CUỘC TRÒ CHUYỆN TRƯỚC ĐÓ:\n${history}

USER: ${content}
ASSISTANT:`;

  const aiStream = await createGeminiStream(prompt);

  let fullAssistant = "";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = aiStream.getReader();

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        // Try to parse as NDJSON of { chunk }
        const lines = chunkText.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj?.chunk) {
              fullAssistant += obj.chunk as string;
            }
          } catch {
            // passthrough if not JSON
          }
        }
        await writer.write(encoder.encode(chunkText));
      }
    } finally {
      await writer.close();
      // Save assistant message at the end
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullAssistant,
        createdAt: new Date().toISOString(),
      } as const;
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          messages: [
            ...((chat.messages as any[]) || []),
            userMessage,
            assistantMessage,
          ] as any,
        },
      });
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
