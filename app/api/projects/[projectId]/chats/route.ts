import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/utils/auth";
import { callGeminiAPI } from "@/lib/gemini";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const chats = await prisma.chat.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json({ data: chats });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const body = await request.json();
  const { content } = body || {};

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { message: "Missing first message content" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
    select: { id: true, context: true, name: true },
  });
  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  // Generate a short title using Gemini based on the first message and project name/context
  let title = "New Chat";
  try {
    const prompt = `Hãy nghĩ tiêu đề ngắn gọn (≤6 từ) cho đoạn chat dựa trên câu hỏi đầu tiên và bối cảnh project.
CÂU HỎI: "${content}"
TÊN PROJECT: "${project.name}"
GỢI Ý: Trả về chỉ mỗi tiêu đề, không giải thích.`;
    const result = await callGeminiAPI(prompt);
    const line = (result || "").split(/\r?\n/)[0].trim();
    title = line || title;
  } catch (e) {
    // keep default title
  }

  const initialMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    contextAttached: !!project.context,
  };

  const chat = await prisma.chat.create({
    data: {
      projectId,
      title,
      messages: [initialMessage] as any,
    },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json({ data: chat }, { status: 201 });
}
