import {
  AppConfig,
  EntityConfig,
  FieldConfig,
  ConfigValidationResult,
} from "@/types/config.types";

const VALID_FIELD_TYPES = [
  "text",
  "email",
  "number",
  "date",
  "boolean",
  "select",
  "textarea",
] as const;

const VALID_PAGE_TYPES = ["table", "form", "dashboard", "detail", "game", "landing"] as const;
const VALID_COMPONENT_TYPES = [
  "stats-card",
  "bar-chart",
  "line-chart",
  "data-table",
  "form",
  "csv-upload",
] as const;

function repairField(field: Record<string, unknown>, warnings: string[]): FieldConfig {
  if (!field.name || typeof field.name !== "string") {
    field.name = `field_${Math.random().toString(36).slice(2, 7)}`;
    warnings.push(`A field was missing a name, generated: ${field.name}`);
  }
  if (!field.label || typeof field.label !== "string") {
    field.label = String(field.name);
  }
  if (!VALID_FIELD_TYPES.includes(field.type as (typeof VALID_FIELD_TYPES)[number])) {
    warnings.push(
      `Field "${field.name}" has invalid type "${field.type}", defaulting to "text"`
    );
    field.type = "text";
  }
  if (field.type === "select" && !Array.isArray(field.options)) {
    warnings.push(`Field "${field.name}" is type select but has no options, adding empty array`);
    field.options = [];
  }
  return field as unknown as FieldConfig;
}

function repairEntity(entity: Record<string, unknown>, warnings: string[]): EntityConfig {
  if (!entity.name || typeof entity.name !== "string") {
    entity.name = `entity_${Math.random().toString(36).slice(2, 7)}`;
    warnings.push(`An entity was missing a name, generated: ${entity.name}`);
  }
  if (!entity.label || typeof entity.label !== "string") {
    entity.label = String(entity.name);
  }
  if (!Array.isArray(entity.fields)) {
    entity.fields = [];
    warnings.push(`Entity "${entity.name}" had no fields array, initialized as empty`);
  }
  entity.fields = (entity.fields as Record<string, unknown>[]).map((f) =>
    repairField(f, warnings)
  );
  return entity as unknown as EntityConfig;
}

export function validateAndRepairConfig(rawConfig: unknown): ConfigValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (typeof rawConfig !== "object" || rawConfig === null) {
    errors.push("Config must be a valid JSON object");
    return {
      config: {
        version: "1.0",
        app: { name: "Untitled App" },
        auth: { enabled: false },
        entities: [],
        pages: [],
      },
      warnings,
      errors,
    };
  }

  const config = rawConfig as Record<string, unknown>;

  // Version
  if (!config.version) {
    config.version = "1.0";
    warnings.push('Version missing, defaulted to "1.0"');
  }

  // App block
  if (!config.app || typeof config.app !== "object") {
    errors.push('"app" config block is required');
    config.app = { name: "Untitled App" };
  } else {
    const app = config.app as Record<string, unknown>;
    if (!app.name) {
      app.name = "Untitled App";
      warnings.push('"app.name" missing, defaulted to "Untitled App"');
    }
    if (app.theme && !["light", "dark", "auto"].includes(String(app.theme))) {
      warnings.push(`Invalid theme "${app.theme}", defaulting to "light"`);
      app.theme = "light";
    }
  }

  // Auth block
  if (!config.auth || typeof config.auth !== "object") {
    config.auth = { enabled: false };
    warnings.push('"auth" block missing, defaulted to { enabled: false }');
  }

  // Entities
  if (!Array.isArray(config.entities)) {
    config.entities = [];
    warnings.push('"entities" missing, initialized as empty array');
  } else {
    config.entities = (config.entities as Record<string, unknown>[]).map((e) =>
      repairEntity(e, warnings)
    );
  }

  // Pages
  if (!Array.isArray(config.pages)) {
    config.pages = [];
    warnings.push('"pages" missing, initialized as empty array');
  } else {
    const entityNames = (config.entities as EntityConfig[]).map((e) => e.name);
    config.pages = (config.pages as Record<string, unknown>[]).map((page) => {
      if (!page.id) {
        page.id = `page_${Math.random().toString(36).slice(2, 7)}`;
        warnings.push(`A page was missing an id, generated: ${page.id}`);
      }
      if (!page.title) {
        page.title = String(page.id);
        warnings.push(`Page "${page.id}" missing title, using id`);
      }
      if (!page.path) {
        page.path = `/${String(page.id)}`;
        warnings.push(`Page "${page.id}" missing path, generated: ${page.path}`);
      }
      if (!VALID_PAGE_TYPES.includes(page.type as (typeof VALID_PAGE_TYPES)[number])) {
        warnings.push(`Page "${page.id}" has invalid type "${page.type}", defaulting to "table"`);
        page.type = "table";
      }
      if (page.entity && !entityNames.includes(String(page.entity))) {
        warnings.push(
          `Page "${page.id}" references unknown entity "${page.entity}", reassigning to first entity`
        );
        page.entity = entityNames[0] ?? undefined;
      }
      // Validate components
      if (Array.isArray(page.components)) {
        page.components = (page.components as Record<string, unknown>[]).map((comp) => {
          if (!comp.id) {
            comp.id = `comp_${Math.random().toString(36).slice(2, 7)}`;
          }
          if (!VALID_COMPONENT_TYPES.includes(comp.type as (typeof VALID_COMPONENT_TYPES)[number])) {
            warnings.push(
              `Component "${comp.id}" has unknown type "${comp.type}", it will render as unsupported`
            );
          }
          return comp;
        });
      }
      return page;
    });
  }

  return { config: config as unknown as AppConfig, warnings, errors };
}

export function parseJsonSafely(
  jsonString: string
): { success: true; data: unknown } | { success: false; error: string; line?: number } {
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Extract line number from JSON parse error message if present
    const lineMatch = message.match(/line (\d+)/i);
    return {
      success: false,
      error: message,
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
    };
  }
}
