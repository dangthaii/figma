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
