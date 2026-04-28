import { z } from "zod";
import { AppConfig, EntityConfig, FieldConfig, PageConfig } from "@/types/config.types";

export function generateZodSchema(fields: FieldConfig[]): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case "email":
        schema = z.string().email(`${field.label} must be a valid email`);
        break;
      case "number":
        schema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          schema = (schema as z.ZodNumber).min(
            field.validation.min,
            `${field.label} must be at least ${field.validation.min}`
          );
        }
        if (field.validation?.max !== undefined) {
          schema = (schema as z.ZodNumber).max(
            field.validation.max,
            `${field.label} must be at most ${field.validation.max}`
          );
        }
        break;
      case "boolean":
        schema = z.boolean();
        break;
      case "date":
        schema = z.string().min(1, `${field.label} is required`);
        break;
      case "textarea":
      case "text":
      case "select":
      default:
        schema = z.string();
        if (field.validation?.min !== undefined) {
          schema = (schema as z.ZodString).min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          schema = (schema as z.ZodString).max(field.validation.max);
        }
        if (field.validation?.pattern) {
          schema = (schema as z.ZodString).regex(new RegExp(field.validation.pattern));
        }
        break;
    }

    if (field.required) {
      if (field.type !== "boolean" && field.type !== "number") {
        schema = (schema as z.ZodString).min(1, `${field.label} is required`);
      }
    } else {
      schema = schema.optional();
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}

export function getEntityConfig(
  appConfig: AppConfig,
  entityName: string
): EntityConfig | undefined {
  return appConfig.entities.find((e) => e.name === entityName);
}

export function getPageConfig(
  appConfig: AppConfig,
  pageId: string
): PageConfig | undefined {
  return appConfig.pages.find((p) => p.id === pageId);
}

export function aggregateEntityData(
  data: Record<string, unknown>[],
  field: string | undefined,
  aggregation: "count" | "sum" | "avg" | undefined
): number {
  if (aggregation === "count" || !field) {
    return data.length;
  }
  const values = data
    .map((row) => parseFloat(String(row[field] ?? 0)))
    .filter((v) => !isNaN(v));

  if (aggregation === "sum") {
    return values.reduce((acc, v) => acc + v, 0);
  }
  if (aggregation === "avg") {
    return values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
  }
  return 0;
}

export function groupByField(
  data: Record<string, unknown>[],
  field: string
): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const row of data) {
    const key = String(row[field] ?? "Unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function stripUnknownFields(
  data: Record<string, unknown>,
  fields: FieldConfig[]
): Record<string, unknown> {
  const allowed = new Set(fields.map((f) => f.name));
  const stripped: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (allowed.has(key)) {
      stripped[key] = data[key];
    }
  }
  return stripped;
}
