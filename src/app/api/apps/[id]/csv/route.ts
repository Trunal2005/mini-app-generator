import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppConfig, DynamicRecord } from "@/types/config.types";
import { getEntityConfig, stripUnknownFields } from "@/lib/runtime-engine";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appId } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityName = formData.get("entityName") as string | null;
    const columnMappingStr = formData.get("columnMapping") as string | null;

    if (!file || !entityName) {
      return NextResponse.json({ error: "file and entityName are required" }, { status: 400 });
    }

    const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    let config: AppConfig;
    try {
      config = typeof app.config === "string" ? JSON.parse(app.config) : (app.config as unknown as AppConfig);
    } catch {
      return NextResponse.json({ error: "Invalid app config" }, { status: 500 });
    }

    const entityConfig = getEntityConfig(config, entityName);
    if (!entityConfig) {
      return NextResponse.json({ error: "Entity not found in config" }, { status: 404 });
    }

    if (!entityConfig.allowCsvImport) {
      return NextResponse.json({ error: "CSV import is not enabled for this entity" }, { status: 403 });
    }

    const csvText = await file.text();
    if (!csvText.trim()) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: "Failed to parse CSV: " + parsed.errors[0].message }, { status: 400 });
    }

    // Column mapping: csvColumn -> entityField
    let columnMapping: Record<string, string> = {};
    if (columnMappingStr) {
      try {
        columnMapping = JSON.parse(columnMappingStr);
      } catch {
        return NextResponse.json({ error: "Invalid column mapping JSON" }, { status: 400 });
      }
    } else {
      const csvColumns = parsed.meta.fields ?? [];
      const fieldNames = entityConfig.fields.map((f) => f.name);
      for (const col of csvColumns) {
        const match = fieldNames.find((fn) => fn.toLowerCase() === col.toLowerCase());
        if (match) columnMapping[col] = match;
      }
    }

    const unmappedCsvColumns = (parsed.meta.fields ?? []).filter((c) => !columnMapping[c]);
    const importWarnings: string[] = [];
    if (unmappedCsvColumns.length > 0) {
      importWarnings.push(`Unmapped CSV columns: ${unmappedCsvColumns.join(", ")}`);
    }

    const importedRecords: DynamicRecord[] = [];
    let skipped = 0;

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const mapped: Record<string, unknown> = {};

      for (const [csvCol, entityField] of Object.entries(columnMapping)) {
        if (row[csvCol] !== undefined) {
          const fieldConfig = entityConfig.fields.find((f) => f.name === entityField);
          if (!fieldConfig) continue;
          let value: unknown = row[csvCol];
          if (fieldConfig.type === "number") value = parseFloat(String(value));
          if (fieldConfig.type === "boolean") value = String(value).toLowerCase() === "true";
          mapped[entityField] = value;
        }
      }

      const stripped = stripUnknownFields(mapped, entityConfig.fields);
      const missingRequired = entityConfig.fields
        .filter((f) => f.required && !stripped[f.name] && stripped[f.name] !== 0 && stripped[f.name] !== false)
        .map((f) => f.label);

      if (missingRequired.length > 0) {
        importWarnings.push(`Row ${i + 2}: Skipped — missing required: ${missingRequired.join(", ")}`);
        skipped++;
        continue;
      }

      importedRecords.push({ id: uuidv4(), ...stripped });
    }

    const existingEntity = await prisma.appEntity.findUnique({
      where: { appId_entityName: { appId, entityName } },
    });

    let existingData: DynamicRecord[] = [];
    if (existingEntity) {
      try {
        const raw = typeof existingEntity.data === "string" ? JSON.parse(existingEntity.data) : existingEntity.data;
        existingData = Array.isArray(raw) ? raw : [];
      } catch {
        existingData = [];
      }
    }

    const updatedData = [...existingData, ...importedRecords];

    await prisma.appEntity.upsert({
      where: { appId_entityName: { appId, entityName } },
      update: { data: JSON.stringify(updatedData) },
      create: { appId, entityName, data: JSON.stringify(updatedData) },
    });

    return NextResponse.json({
      imported: importedRecords.length,
      skipped,
      warnings: importWarnings,
    });
  } catch (error) {
    console.error("POST /api/apps/[id]/csv error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
