import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppConfig, DynamicRecord } from "@/types/config.types";
import { generateZodSchema, getEntityConfig, stripUnknownFields } from "@/lib/runtime-engine";
import { v4 as uuidv4 } from "uuid";

interface RouteParams {
  params: Promise<{ appId: string; entity: string }>;
}

async function getAppAndEntity(appId: string, entityName: string, userId: string) {
  const app = await prisma.app.findFirst({ where: { id: appId, userId } });
  if (!app) return { app: null, entityConfig: null, appEntity: null };

  let config: AppConfig;
  try {
    config = typeof app.config === "string" ? JSON.parse(app.config) : (app.config as unknown as AppConfig);
  } catch {
    return { app, entityConfig: null, appEntity: null };
  }

  const entityConfig = getEntityConfig(config, entityName);
  if (!entityConfig) return { app, entityConfig: null, appEntity: null };

  const appEntity = await prisma.appEntity.findUnique({
    where: { appId_entityName: { appId, entityName } },
  });

  return { app, entityConfig, appEntity };
}

function parseEntityData(appEntity: { data: string } | null): DynamicRecord[] {
  if (!appEntity) return [];
  try {
    const raw = typeof appEntity.data === "string" ? JSON.parse(appEntity.data) : appEntity.data;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, entity } = await params;
    const { entityConfig, appEntity } = await getAppAndEntity(appId, entity, session.user.id);

    if (!entityConfig) {
      return NextResponse.json({ error: "App or entity not found" }, { status: 404 });
    }

    const data = parseEntityData(appEntity as { data: string } | null);
    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("GET /api/dynamic error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, entity } = await params;
    const { app, entityConfig, appEntity } = await getAppAndEntity(appId, entity, session.user.id);

    if (!app || !entityConfig) {
      return NextResponse.json({ error: "App or entity not found" }, { status: 404 });
    }

    const body = await req.json();
    const stripped = stripUnknownFields(body, entityConfig.fields);
    const schema = generateZodSchema(entityConfig.fields);
    const result = schema.safeParse(stripped);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const newRecord: DynamicRecord = { id: uuidv4(), ...result.data as Record<string, unknown> };
    const currentData = parseEntityData(appEntity as { data: string } | null);
    const updatedData = [...currentData, newRecord];

    await prisma.appEntity.upsert({
      where: { appId_entityName: { appId, entityName: entity } },
      update: { data: JSON.stringify(updatedData) },
      create: { appId, entityName: entity, data: JSON.stringify(updatedData) },
    });

    return NextResponse.json({ record: newRecord }, { status: 201 });
  } catch (error) {
    console.error("POST /api/dynamic error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, entity } = await params;
    const { entityConfig, appEntity } = await getAppAndEntity(appId, entity, session.user.id);

    if (!entityConfig) {
      return NextResponse.json({ error: "App or entity not found" }, { status: 404 });
    }

    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Record id is required" }, { status: 400 });
    }

    const stripped = stripUnknownFields(rest, entityConfig.fields);
    const schema = generateZodSchema(entityConfig.fields);
    const result = schema.safeParse(stripped);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const currentData = parseEntityData(appEntity as { data: string } | null);
    const idx = currentData.findIndex((r) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    currentData[idx] = { ...currentData[idx], ...result.data as Record<string, unknown> };

    await prisma.appEntity.update({
      where: { appId_entityName: { appId, entityName: entity } },
      data: { data: JSON.stringify(currentData) },
    });

    return NextResponse.json({ record: currentData[idx] });
  } catch (error) {
    console.error("PUT /api/dynamic error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, entity } = await params;
    const { entityConfig, appEntity } = await getAppAndEntity(appId, entity, session.user.id);

    if (!entityConfig) {
      return NextResponse.json({ error: "App or entity not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Record id is required" }, { status: 400 });
    }

    const currentData = parseEntityData(appEntity as { data: string } | null);
    const updatedData = currentData.filter((r) => r.id !== id);

    if (updatedData.length === currentData.length) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.appEntity.update({
      where: { appId_entityName: { appId, entityName: entity } },
      data: { data: JSON.stringify(updatedData) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dynamic error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
