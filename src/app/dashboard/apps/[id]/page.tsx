"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppConfig, DynamicRecord, PageConfig, EntityConfig } from "@/types/config.types";
import { getEntityConfig } from "@/lib/runtime-engine";
import ComponentRenderer from "@/components/runtime/ComponentRenderer";
import DynamicForm from "@/components/runtime/DynamicForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  Settings,
  RefreshCw,
  LayoutDashboard,
  Table2,
  FileText,
  AlertCircle,
  ChevronLeft,
  Gamepad2,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

const pageTypeIcons: Record<string, React.ElementType> = {
  table: Table2,
  form: FileText,
  dashboard: LayoutDashboard,
  detail: FileText,
  game: Gamepad2,
  landing: Globe2,
};

export default function AppRuntimePage({ params }: PageProps) {
  const { id: appId } = use(params);
  const router = useRouter();

  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [appName, setAppName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Currently selected page from left nav
  const [activePage, setActivePage] = useState<PageConfig | null>(null);

  // Entity data cache: entityName -> records[]
  const [entityData, setEntityData] = useState<Record<string, DynamicRecord[]>>({});

  // Add / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DynamicRecord | null>(null);

  // ─── Fetch App ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/apps/${appId}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const config = data.app.config as AppConfig;
        setAppConfig(config);
        setAppName(config.app.name);
        // Default to first page
        if (config.pages.length > 0) {
          setActivePage(config.pages[0]);
        }
      } catch {
        toast.error("Failed to load app");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId]);

  // ─── Fetch Entity Data ────────────────────────────────────────────
  const fetchEntityData = useCallback(
    async (entityName: string) => {
      setDataLoading(true);
      try {
        const res = await fetch(`/api/dynamic/${appId}/${entityName}`);
        const data = await res.json();
        if (res.ok) {
          setEntityData((prev) => ({ ...prev, [entityName]: data.data }));
        }
      } catch {
        toast.error(`Failed to load ${entityName} data`);
      } finally {
        setDataLoading(false);
      }
    },
    [appId]
  );

  // Load data whenever the active page changes
  useEffect(() => {
    if (!activePage || !appConfig) return;

    if (activePage.entity) {
      fetchEntityData(activePage.entity);
    } else if (activePage.type === "dashboard") {
      // Fetch all entities referenced in dashboard components
      const needed = new Set<string>();
      (activePage.components ?? []).forEach((c) => {
        if (c.entity) needed.add(c.entity);
      });
      needed.forEach((name) => fetchEntityData(name));
    }
  }, [activePage, appConfig, fetchEntityData]);

  // ─── CRUD handlers ────────────────────────────────────────────────
  const currentEntityConfig: EntityConfig | undefined =
    appConfig && activePage?.entity
      ? getEntityConfig(appConfig, activePage.entity)
      : undefined;

  const currentData: DynamicRecord[] =
    activePage?.entity ? (entityData[activePage.entity] ?? []) : [];

  const handleAddRecord = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEditRecord = (record: DynamicRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleDeleteRecord = async (record: DynamicRecord) => {
    if (!activePage?.entity) return;
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch(
        `/api/dynamic/${appId}/${activePage.entity}?id=${record.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchEntityData(activePage.entity);
        toast.success("Record deleted");
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Delete failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (!activePage?.entity) return;
    const isEdit = !!editingRecord;
    const url = `/api/dynamic/${appId}/${activePage.entity}`;
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit ? { id: editingRecord.id, ...data } : data;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      const fieldErrors = json.fieldErrors as Record<string, string[]> | undefined;
      const firstError = fieldErrors
        ? Object.values(fieldErrors).flat()[0]
        : json.error;
      throw new Error(firstError ?? "Save failed");
    }

    await fetchEntityData(activePage.entity);
    setFormOpen(false);
    toast.success(isEdit ? "Record updated!" : "Record added!");
  };

  // ─── Not Found ────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200">App not found</h2>
        <p className="text-gray-500 text-sm">
          This app may have been deleted or you don&apos;t have access.
        </p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-gray-800/50" />
        <div className="flex gap-4">
          <Skeleton className="h-96 w-48 bg-gray-800/50 rounded-2xl" />
          <Skeleton className="h-96 flex-1 bg-gray-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── Main Runtime UI ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-200 transition-colors">
            My Apps
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-200 font-medium">{appName}</span>
          {activePage && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-indigo-400">{activePage.title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </Badge>
          <Link href={`/dashboard/apps/${appId}/config`}>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-1.5 text-xs"
            >
              <Settings className="w-3 h-3" />
              Edit Config
            </Button>
          </Link>
        </div>
      </div>

      {/* Two-column layout: left nav + main content */}
      {appConfig && (appConfig.pages.length > 0 || appConfig.entities.length > 0) ? (
        <div className="flex gap-4 min-h-[70vh]">
          {/* Left page nav */}
          <aside className="w-52 shrink-0 hidden md:block">
            <div className="rounded-2xl bg-[#131b2e] border border-gray-700/20 overflow-hidden">
              <div className="px-3 py-3 border-b border-gray-700/20">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pages</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {appConfig.pages.map((page) => {
                  const Icon = pageTypeIcons[page.type] ?? FileText;
                  const isActive = activePage?.id === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActivePage(page)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300 font-medium"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : ""}`} />
                      <span className="truncate">{page.title}</span>
                    </button>
                  );
                })}
                {appConfig.pages.length === 0 && (
                  <p className="text-xs text-gray-600 px-3 py-4 text-center">
                    No pages configured
                  </p>
                )}
              </nav>
            </div>

            {/* Entity list (mini) */}
            {appConfig.entities.length > 0 && (
              <div className="mt-3 rounded-2xl bg-[#131b2e] border border-gray-700/20 overflow-hidden">
                <div className="px-3 py-3 border-b border-gray-700/20">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Entities</p>
                </div>
                <div className="p-2 space-y-0.5">
                  {appConfig.entities.map((entity) => (
                    <div
                      key={entity.name}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      <span className="truncate">{entity.label}</span>
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-gray-800 text-gray-500 border-0 text-[10px] px-1"
                      >
                        {entity.fields.length}f
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {activePage ? (
              <div className="rounded-2xl bg-[#131b2e] border border-gray-700/20 p-6 min-h-full">
                {dataLoading && activePage.type !== "form" && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading data...
                  </div>
                )}
                <ComponentRenderer
                  page={activePage}
                  appConfig={appConfig}
                  appId={appId}
                  entityConfig={currentEntityConfig}
                  data={currentData}
                  loading={dataLoading}
                  entityData={entityData}
                  onAdd={handleAddRecord}
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                  onFormSubmit={handleFormSubmit}
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-[#131b2e] border border-gray-700/20 p-12 flex flex-col items-center justify-center text-center">
                <LayoutDashboard className="w-10 h-10 text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">Select a page from the left navigation</p>
              </div>
            )}
          </main>
        </div>
      ) : (
        /* Empty config state */
        <div className="rounded-2xl bg-[#131b2e] border border-gray-700/20 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
            <Settings className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">No pages configured</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            This app has no pages or entities defined yet. Go to the config editor to add them.
          </p>
          <Link href={`/dashboard/apps/${appId}/config`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Settings className="w-4 h-4" />
              Open Config Editor
            </Button>
          </Link>
        </div>
      )}

      {/* Add / Edit Record Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#131b2e] border-gray-700/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {editingRecord ? "Edit" : "Add"} {currentEntityConfig?.label ?? "Record"}
            </DialogTitle>
          </DialogHeader>
          {currentEntityConfig && (
            <DynamicForm
              key={editingRecord?.id ?? "new"}
              fields={currentEntityConfig.fields}
              onSubmit={handleFormSubmit}
              defaultValues={editingRecord ?? {}}
              submitLabel={editingRecord ? "Save Changes" : `Add ${currentEntityConfig.label}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
