import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/utils/auth";
import { callGeminiAPI } from "@/lib/gemini";

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
  const { userMessage, assistantMessage } = await request.json();

  if (!userMessage || !assistantMessage) {
    return new Response(
      JSON.stringify({ message: "Missing required fields" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check if user has access to this project and chat
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      projectId,
      project: { ownerId: session.user.id },
    },
    select: {
      id: true,
      title: true,
      project: { select: { name: true } },
    },
  });

  if (!chat) {
    return new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
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
      return new Response(
        JSON.stringify({
          message: "Not a web demo request",
          shouldCreate: false,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
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
    const webDemo = await (prisma as any).webDemo.create({
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

    return new Response(
      JSON.stringify({
        message: "Web demo created successfully",
        webDemo: {
          id: webDemo.id,
          name: webDemo.name,
          description: webDemo.description,
          createdAt: webDemo.createdAt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating web demo:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to create web demo",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(
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

  try {
    const webDemos = await (prisma as any).webDemo.findMany({
      where: {
        projectId,
        chatId,
        project: { ownerId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        metadata: true,
        htmlContent: true,
      },
    });

    return new Response(JSON.stringify({ webDemos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching web demos:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to fetch web demos",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
