import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/utils/auth";
import { createGeminiStream, callGeminiAPI } from "@/lib/gemini";

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

      // Check if this conversation should trigger web demo creation
      try {
        await checkAndCreateWebDemo(projectId, chatId, content, fullAssistant);
      } catch (error) {
        console.error("Failed to create web demo:", error);
        // Don't fail the main request if web demo creation fails
      }
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

async function checkAndCreateWebDemo(
  projectId: string,
  chatId: string,
  userMessage: string,
  assistantMessage: string
) {
  // Analyze the conversation to determine if it's a web demo request
  const analysisPrompt = `Analyze this conversation to determine if the user is requesting a web demo/website creation:

USER: "${userMessage}"
ASSISTANT: "${assistantMessage}"

Determine if this is a request for:
1. Creating a website/web page
2. Building HTML/CSS demo
3. Making a web application
4. Any other web development task

Look for keywords like: "tạo trang web", "tạo demo", "HTML", "CSS", "website", "trang web", "demo", "landing page", "portfolio", "blog", "dashboard"

Respond with ONLY a JSON object:
{
  "isWebDemoRequest": boolean,
  "demoType": "landing_page" | "portfolio" | "blog" | "dashboard" | "other",
  "features": string[],
  "style": "modern" | "minimal" | "colorful" | "professional" | "other",
  "shouldCreate": boolean
}

If it's NOT a web demo request, set "shouldCreate" to false.`;

  const analysis = await callGeminiAPI(analysisPrompt);
  let parsedAnalysis;

  try {
    parsedAnalysis = JSON.parse(analysis);
  } catch {
    // If AI response is not valid JSON, try to extract JSON from the response
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedAnalysis = JSON.parse(jsonMatch[0]);
    } else {
      parsedAnalysis = { shouldCreate: false };
    }
  }

  if (!parsedAnalysis.shouldCreate) {
    return;
  }

  // Generate the web demo using AI
  const demoPrompt = `Create a complete, functional HTML/CSS website based on this request:

USER REQUEST: "${userMessage}"
ASSISTANT RESPONSE: "${assistantMessage}"
DEMO TYPE: ${parsedAnalysis.demoType}
FEATURES: ${parsedAnalysis.features.join(", ")}
STYLE: ${parsedAnalysis.style}

Requirements:
1. Create a complete, standalone HTML file with embedded CSS
2. Make it responsive and modern
3. Include all necessary functionality
4. Use semantic HTML5
5. Include modern CSS features (flexbox, grid, animations)
6. Make it visually appealing and professional
7. Ensure it works without external dependencies
8. Make it suitable for the Vietnamese market if mentioned

Return ONLY the complete HTML file with embedded CSS. No explanations, just the HTML code.`;

  const htmlContent = await callGeminiAPI(demoPrompt);

  // Create the web demo record using any type to avoid Prisma client issues
  await (prisma as any).webDemo.create({
    data: {
      projectId,
      chatId,
      name: `Demo: ${parsedAnalysis.demoType.replace(/_/g, " ")}`,
      description: `Generated from: ${userMessage}`,
      htmlContent,
      isInlineCSS: true,
      metadata: {
        demoType: parsedAnalysis.demoType,
        features: parsedAnalysis.features,
        style: parsedAnalysis.style,
        userRequest: userMessage,
      },
    },
  });
}
