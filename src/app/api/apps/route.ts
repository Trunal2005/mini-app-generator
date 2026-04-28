import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAndRepairConfig } from "@/lib/config-validator";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await prisma.app.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { entities: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("GET /api/apps error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { config: rawConfig } = body;

    if (!rawConfig) {
      return NextResponse.json({ error: "Config is required" }, { status: 400 });
    }

    const { config, warnings, errors } = validateAndRepairConfig(rawConfig);

    if (errors.length > 0) {
      return NextResponse.json({ error: "Config validation failed", errors }, { status: 400 });
    }

    const app = await prisma.app.create({
      data: {
        name: config.app.name,
        description: config.app.description ?? null,
        config: JSON.stringify(config),
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { app: { ...app, config }, warnings },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/apps error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
