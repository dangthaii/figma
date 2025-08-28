import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/utils/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; chatId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, chatId } = await params;

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, projectId, project: { ownerId: session.user.id } },
    select: { id: true, title: true, messages: true, createdAt: true },
  });

  if (!chat) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: chat });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; chatId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, chatId } = await params;
  const body = await request.json();
  const { title } = body || {};
  if (!title || typeof title !== "string") {
    return NextResponse.json({ message: "Missing title" }, { status: 400 });
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, projectId, project: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!chat) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await prisma.chat.update({
    where: { id: chatId },
    data: { title },
    select: { id: true, title: true },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; chatId: string }> }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId, chatId } = await params;

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, projectId, project: { ownerId: session.user.id } },
    select: { id: true },
  });
  if (!chat) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.chat.delete({ where: { id: chatId } });
  return NextResponse.json({ success: true });
}
