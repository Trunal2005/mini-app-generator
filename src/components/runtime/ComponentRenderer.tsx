"use client";

import { PageConfig, AppConfig, DynamicRecord, EntityConfig } from "@/types/config.types";
import DynamicTable from "./DynamicTable";
import DynamicForm from "./DynamicForm";
import DynamicDashboard from "./DynamicDashboard";
import CsvImport from "./CsvImport";
import GeneratedExperience from "./GeneratedExperience";
import { AlertCircle, LockIcon } from "lucide-react";

interface ComponentRendererProps {
  page: PageConfig;
  appConfig: AppConfig;
  appId: string;
  // For table/form pages
  entityConfig?: EntityConfig;
  data?: DynamicRecord[];
  loading?: boolean;
  // Entity data map for dashboard
  entityData?: Record<string, DynamicRecord[]>;
  // Callbacks
  onAdd?: () => void;
  onEdit?: (record: DynamicRecord) => void;
  onDelete?: (record: DynamicRecord) => void;
  onFormSubmit?: (data: Record<string, unknown>) => Promise<void>;
  // Auth
  userRoles?: string[];
}

export default function ComponentRenderer({
  page,
  appConfig,
  appId,
  entityConfig,
  data = [],
  loading = false,
  entityData = {},
  onAdd,
  onEdit,
  onDelete,
  onFormSubmit,
  userRoles = [],
}: ComponentRendererProps) {
  // Permission check
  if (page.permissions && page.permissions.length > 0) {
    const hasPermission = page.permissions.some((role) => userRoles.includes(role));
    if (!hasPermission && appConfig.auth.enabled) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <LockIcon className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Access Restricted</h3>
          <p className="text-sm text-gray-500">
            You don&apos;t have permission to view this page.
            <br />Required roles: {page.permissions.join(", ")}
          </p>
        </div>
      );
    }
  }

  try {
    switch (page.type) {
      case "table":
        if (!entityConfig) {
          return <MissingEntityError page={page} />;
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-100">{page.title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {data.length} record{data.length !== 1 ? "s" : ""}
                </p>
              </div>
              {entityConfig.allowCsvImport && (
                <CsvImport
                  appId={appId}
                  entityName={entityConfig.name}
                  fields={entityConfig.fields}
                  onSuccess={() => window.location.reload()}
                />
              )}
            </div>
            <DynamicTable
              entityConfig={entityConfig}
              data={data}
              loading={loading}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );

      case "form":
        if (!entityConfig) {
          return <MissingEntityError page={page} />;
        }
        return (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100">{page.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill in the fields below to add a new {entityConfig.label} record
              </p>
            </div>
            <div className="rounded-2xl bg-[#131b2e] border border-gray-700/30 p-6">
              <DynamicForm
                fields={entityConfig.fields}
                onSubmit={onFormSubmit ?? (async () => {})}
                submitLabel={`Save ${entityConfig.label}`}
              />
            </div>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">{page.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">Live data from your entities</p>
            </div>
            <DynamicDashboard
              components={page.components ?? []}
              appConfig={appConfig}
              entityData={entityData}
              loading={loading}
            />
          </div>
        );

      case "game":
      case "landing":
        return <GeneratedExperience page={page} appConfig={appConfig} />;

      case "detail":
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Detail View</h3>
            <p className="text-sm text-gray-500">Select a record from the table to view details.</p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-300 mb-1">Unknown Page Type</h3>
            <p className="text-sm text-gray-500">
              Page type <code className="text-yellow-400">&quot;{page.type}&quot;</code> is not supported.
            </p>
          </div>
        );
    }
  } catch (err) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-300 mb-1">Render Error</h3>
        <p className="text-xs text-gray-500 font-mono">
          {err instanceof Error ? err.message : "Unknown error occurred"}
        </p>
      </div>
    );
  }
}

function MissingEntityError({ page }: { page: PageConfig }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-yellow-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-300 mb-1">Entity Not Found</h3>
      <p className="text-sm text-gray-500">
        Page <code className="text-yellow-400">&quot;{page.title}&quot;</code> references entity{" "}
        <code className="text-yellow-400">&quot;{page.entity}&quot;</code> which doesn&apos;t exist in config.
      </p>
    </div>
  );
}
