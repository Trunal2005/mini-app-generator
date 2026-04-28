"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppConfig } from "@/types/config.types";
import { parseJsonSafely } from "@/lib/config-validator";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { generateConfigFromPrompt } from "@/lib/app-config-generator";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConfigEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [rawConfig, setRawConfig] = useState("");
  const [parsedConfig, setParsedConfig] = useState<AppConfig | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/apps/${id}`);
        if (res.status === 404) { router.push("/dashboard"); return; }
        const data = await res.json();
        if (res.ok) {
          const configStr = JSON.stringify(data.app.config, null, 2);
          setRawConfig(configStr);
          setParsedConfig(data.app.config as AppConfig);
        }
      } catch {
        toast.error("Failed to load app");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id, router]);

  const handleValidate = () => {
    setParseError(null);
    setWarnings([]);
    setErrors([]);
    const parseResult = parseJsonSafely(rawConfig);
    if (!parseResult.success) {
      setParseError(parseResult.error + (parseResult.line ? ` (line ${parseResult.line})` : ""));
      setParsedConfig(null);
      return;
    }
    // Send to validate API
    fetch(`/api/apps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: parseResult.data }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.warnings) setWarnings(data.warnings);
        if (data.errors) setErrors(data.errors);
        if (data.app) {
          setParsedConfig(data.app.config as AppConfig);
          setRawConfig(JSON.stringify(data.app.config, null, 2));
          toast.success("Config saved & validated!");
        }
      })
      .catch(() => toast.error("Validation failed"));
  };

  const handleSave = async () => {
    setSaving(true);
    setParseError(null);
    const parseResult = parseJsonSafely(rawConfig);
    if (!parseResult.success) {
      setParseError(parseResult.error + (parseResult.line ? ` (line ${parseResult.line})` : ""));
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: parseResult.data }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        toast.error(data.error ?? "Save failed");
        return;
      }
      setWarnings(data.warnings ?? []);
      setErrors([]);
      setParsedConfig(data.app.config as AppConfig);
      setRawConfig(JSON.stringify(data.app.config, null, 2));
      toast.success("Config saved!");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFromDescription = async () => {
    setGenerating(true);
    setParseError(null);
    setWarnings([]);
    setErrors([]);

    const parseResult = parseJsonSafely(rawConfig);
    const sourceConfig =
      parseResult.success && typeof parseResult.data === "object" && parseResult.data
        ? (parseResult.data as Partial<AppConfig>)
        : parsedConfig;

    const appBlock = sourceConfig?.app;
    const appName = appBlock?.name ?? "Generated App";
    const description = appBlock?.description ?? "";
    const generatedConfig = generateConfigFromPrompt(appName, description);

    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: generatedConfig }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        toast.error(data.error ?? "Generate failed");
        return;
      }

      setWarnings(data.warnings ?? []);
      setParsedConfig(data.app.config as AppConfig);
      setRawConfig(JSON.stringify(data.app.config, null, 2));
      toast.success("App generated from description!");
    } catch {
      toast.error("Network error");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/dashboard" className="hover:text-gray-200 transition-colors">My Apps</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-200">{parsedConfig?.app.name ?? "App"}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-indigo-400">Config Editor</span>
      </div>

      {/* Alerts */}
      {parseError && (
        <Alert className="border-red-500/30 bg-red-500/10 mb-3">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 text-sm font-mono">{parseError}</AlertDescription>
        </Alert>
      )}
      {errors.length > 0 && (
        <Alert className="border-red-500/30 bg-red-500/10 mb-3">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 text-sm">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </AlertDescription>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10 mb-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300 text-sm">
            {warnings.map((w, i) => <div key={i}>{w}</div>)}
          </AlertDescription>
        </Alert>
      )}

      {/* Two-Panel Editor */}
      <div className="flex-1 grid lg:grid-cols-[1fr,420px] gap-4 min-h-0">
        {/* Left: Editor */}
        <div className="flex flex-col rounded-2xl border border-gray-700/30 bg-[#131b2e] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-gray-500 font-mono ml-2">config.json</span>
            </div>
            <div className="flex items-center gap-2">
              {warnings.length > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
                </Badge>
              )}
              {errors.length === 0 && !parseError && parsedConfig && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </Badge>
              )}
            </div>
          </div>
          <textarea
            value={rawConfig}
            onChange={(e) => setRawConfig(e.target.value)}
            className="flex-1 font-mono text-sm text-green-300 bg-transparent p-4 resize-none outline-none leading-relaxed"
            placeholder="Paste your JSON config here..."
            spellCheck={false}
          />
        </div>

        {/* Right: Preview */}
        <div className="rounded-2xl border border-gray-700/30 bg-[#131b2e] overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-700/30">
            <h3 className="text-sm font-medium text-gray-300">Config Preview</h3>
          </div>
          {parsedConfig ? (
            <div className="p-4 space-y-5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">App</p>
                <h2 className="text-lg font-semibold text-gray-100">{parsedConfig.app.name}</h2>
                {parsedConfig.app.description && (
                  <p className="text-sm text-gray-400 mt-1">{parsedConfig.app.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">v{parsedConfig.version}</Badge>
                  {parsedConfig.auth.enabled && (
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">Auth enabled</Badge>
                  )}
                </div>
              </div>

              {parsedConfig.entities.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Entities ({parsedConfig.entities.length})</p>
                  <div className="space-y-2">
                    {parsedConfig.entities.map((e) => (
                      <div key={e.name} className="p-3 bg-gray-800/40 rounded-lg border-l-2 border-indigo-500/40">
                        <p className="text-sm font-medium text-gray-200">{e.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{e.fields.length} fields: {e.fields.map(f => f.name).join(", ")}</p>
                        {e.allowCsvImport && (
                          <Badge className="mt-1 bg-blue-500/20 text-blue-300 border-0 text-[10px]">CSV Import enabled</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedConfig.pages.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pages ({parsedConfig.pages.length})</p>
                  <div className="space-y-2">
                    {parsedConfig.pages.map((p) => (
                      <div key={p.id} className="p-3 bg-gray-800/40 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-200">{p.title}</p>
                          <p className="text-xs text-gray-500">{p.path}</p>
                        </div>
                        <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                          {p.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link href={`/dashboard/apps/${id}`}>
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Open App Runtime →
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Fix errors to see preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between gap-4 mt-4 py-4 border-t border-gray-700/30">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {parseError && <span className="text-red-400 text-xs">✗ JSON parse error</span>}
          {!parseError && errors.length === 0 && parsedConfig && (
            <span className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Config is valid
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateFromDescription}
            disabled={generating}
            className="border-indigo-500/50 text-indigo-200 hover:bg-indigo-500/10 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating..." : "Generate App"}
          </Button>
          <Button
            variant="outline"
            onClick={handleValidate}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Validate
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Config"}
          </Button>
        </div>
      </div>
    </div>
  );
}
