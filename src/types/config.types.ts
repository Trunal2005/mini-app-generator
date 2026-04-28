export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "textarea";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
  validation?: FieldValidation;
}

export interface EntityConfig {
  name: string;
  label: string;
  fields: FieldConfig[];
  allowCsvImport?: boolean;
}

export type ComponentType =
  | "stats-card"
  | "bar-chart"
  | "line-chart"
  | "data-table"
  | "form"
  | "csv-upload";

export type AggregationType = "count" | "sum" | "avg";

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  title?: string;
  entity?: string;
  field?: string;
  aggregation?: AggregationType;
}

export type PageType = "table" | "form" | "dashboard" | "detail" | "game" | "landing";

export interface PageExperience {
  kind: "flappy-bird" | "landing";
  prompt?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  features?: string[];
}

export interface PageConfig {
  id: string;
  title: string;
  path: string;
  type: PageType;
  entity?: string;
  components?: ComponentConfig[];
  permissions?: string[];
  experience?: PageExperience;
}

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    events: string[];
  };
}

export interface AppConfig {
  version: string;
  app: {
    name: string;
    description?: string;
    theme?: "light" | "dark" | "auto";
    language?: string;
  };
  auth: {
    enabled: boolean;
    roles?: string[];
  };
  entities: EntityConfig[];
  pages: PageConfig[];
  notifications?: NotificationConfig;
}

export interface ConfigValidationResult {
  config: AppConfig;
  warnings: string[];
  errors: string[];
}

export interface DynamicRecord {
  id: string;
  [key: string]: unknown;
}
