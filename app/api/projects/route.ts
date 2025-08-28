import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/utils/auth";
import { FigmaService } from "@/lib/figma";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, figmaLink: true, createdAt: true },
  });

  return NextResponse.json({ data: projects });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, figmaLink, context } = body || {};

  if (!name || !figmaLink) {
    return NextResponse.json(
      { message: "Missing name or figmaLink" },
      { status: 400 }
    );
  }

  // Fetch Figma context using API key
  let projectContext = context ?? null;
  try {
    const apiKey = process.env.FIGMA_API_KEY || "";
    if (apiKey) {
      const figma = new FigmaService(apiKey);
      const data = await figma.getFileData(figmaLink);
      projectContext = data ?? null;
    }
  } catch (err) {
    // If Figma fetch fails, proceed without blocking creation
    projectContext = null;
  }

  const project = await prisma.project.create({
    data: {
      name,
      figmaLink,
      context: projectContext,
      ownerId: session.user.id,
    },
    select: { id: true, name: true, figmaLink: true, createdAt: true },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
