"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import { FieldConfig } from "@/types/config.types";

interface CsvImportProps {
  appId: string;
  entityName: string;
  fields: FieldConfig[];
  onSuccess?: (imported: number, skipped: number) => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  warnings: string[];
}

interface ColumnMapping {
  [csvCol: string]: string;
}

export default function CsvImport({ appId, entityName, fields, onSuccess }: CsvImportProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      setResult(null);
      setError(null);

      Papa.parse<Record<string, string>>(f, {
        header: true,
        preview: 6,
        skipEmptyLines: true,
        complete: (res) => {
          const headers = res.meta.fields ?? [];
          setCsvHeaders(headers);
          setPreview(res.data as Record<string, string>[]);

          // Auto-map
          const autoMap: ColumnMapping = {};
          const fieldNames = fields.map((f) => f.name);
          for (const col of headers) {
            const match = fieldNames.find(
              (fn) => fn.toLowerCase() === col.toLowerCase()
            );
            if (match) autoMap[col] = match;
          }
          setColumnMapping(autoMap);
        },
        error: (err) => setError(err.message),
      });
    },
    [fields]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f?.type === "text/csv" || f?.name.endsWith(".csv")) {
        handleFile(f);
      } else {
        setError("Please upload a CSV file");
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityName", entityName);
      formData.append("columnMapping", JSON.stringify(columnMapping));

      const res = await fetch(`/api/apps/${appId}/csv`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
      } else {
        setResult(data);
        onSuccess?.(data.imported, data.skipped);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setResult(null);
    setError(null);
  };

  const unmappedCsvCols = csvHeaders.filter((h) => !columnMapping[h]);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-2"
      >
        <Upload className="w-4 h-4" />
        CSV Import
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="bg-[#131b2e] border-gray-700/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              Import CSV → {entityName}
            </DialogTitle>
          </DialogHeader>

          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                dragOver
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 font-medium">Drag & drop CSV file here</p>
              <p className="text-gray-500 text-sm mt-1">or</p>
              <label className="mt-3 inline-block cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
                  Browse File
                </span>
              </label>
            </div>
          )}

          {file && !result && (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="w-6 h-6 p-0 text-gray-500 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {/* Column Mapping */}
              {csvHeaders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Column Mapping</h4>
                  <div className="space-y-2">
                    {csvHeaders.map((csvCol) => (
                      <div key={csvCol} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-1/3 truncate font-mono bg-gray-800/50 px-2 py-1 rounded">
                          {csvCol}
                        </span>
                        <span className="text-gray-600">→</span>
                        <select
                          value={columnMapping[csvCol] ?? ""}
                          onChange={(e) =>
                            setColumnMapping((prev) => ({
                              ...prev,
                              [csvCol]: e.target.value || "",
                            }))
                          }
                          className="flex-1 text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 focus:border-indigo-500 outline-none"
                        >
                          <option value="">Skip this column</option>
                          {fields.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.label} ({f.name})
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {unmappedCsvCols.length > 0 && (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {unmappedCsvCols.length} column(s) will be skipped
                    </p>
                  )}
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">
                    Preview (first {preview.length} rows)
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-700/30">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-800/60">
                        <tr>
                          {csvHeaders.map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-400">
                              {h}
                              {columnMapping[h] && (
                                <Badge className="ml-1 text-[10px] bg-indigo-500/20 text-indigo-300 border-0">
                                  → {columnMapping[h]}
                                </Badge>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-gray-700/20">
                            {csvHeaders.map((h) => (
                              <td key={h} className="px-3 py-1.5 text-gray-300 truncate max-w-[120px]">
                                {row[h] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {uploading && <Progress className="h-1 bg-gray-700" value={undefined} />}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={reset} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={uploading || csvHeaders.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {uploading ? "Importing..." : "Import"}
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-green-300 font-medium">Import complete!</p>
                  <p className="text-sm text-gray-400">
                    {result.imported} imported, {result.skipped} skipped
                  </p>
                </div>
              </div>
              {result.warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-yellow-400">Warnings:</p>
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-gray-400 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
              <Button
                onClick={() => { setOpen(false); reset(); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
