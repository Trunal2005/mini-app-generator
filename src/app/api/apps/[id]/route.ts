import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAndRepairConfig } from "@/lib/config-validator";
import { AppConfig } from "@/types/config.types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseAppConfig(app: { config: string; [key: string]: unknown }): AppConfig {
  try {
    return typeof app.config === "string" ? JSON.parse(app.config) : (app.config as AppConfig);
  } catch {
    return { version: "1.0", app: { name: "Unknown" }, auth: { enabled: false }, entities: [], pages: [] };
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const app = await prisma.app.findFirst({
      where: { id, userId: session.user.id },
      include: { entities: true },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const parsedConfig = parseAppConfig(app as unknown as { config: string; [key: string]: unknown });
    return NextResponse.json({ app: { ...app, config: parsedConfig } });
  } catch (error) {
    console.error("GET /api/apps/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.app.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
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

    const app = await prisma.app.update({
      where: { id },
      data: {
        name: config.app.name,
        description: config.app.description ?? null,
        config: JSON.stringify(config),
      },
    });

    return NextResponse.json({ app: { ...app, config }, warnings });
  } catch (error) {
    console.error("PUT /api/apps/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.app.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    await prisma.app.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/apps/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
