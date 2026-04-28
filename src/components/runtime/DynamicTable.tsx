"use client";

import { useState, useMemo } from "react";
import { EntityConfig, DynamicRecord } from "@/types/config.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Pencil,
  Trash2,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;

interface DynamicTableProps {
  entityConfig: EntityConfig;
  data: DynamicRecord[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (record: DynamicRecord) => void;
  onDelete?: (record: DynamicRecord) => void;
}

type SortDirection = "asc" | "desc" | null;

export default function DynamicTable({
  entityConfig,
  data,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}: DynamicTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      entityConfig.fields.some((f) =>
        String(row[f.name] ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, search, entityConfig.fields]);

  const sortedData = useMemo(() => {
    if (!sortField || !sortDir) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const paginatedData = sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const renderCellValue = (record: DynamicRecord, fieldName: string, fieldType: string) => {
    const val = record[fieldName];
    if (val === null || val === undefined) return <span className="text-gray-500 text-xs italic">—</span>;
    if (fieldType === "boolean") {
      return (
        <Badge variant={val ? "default" : "secondary"} className={val ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
          {val ? "Yes" : "No"}
        </Badge>
      );
    }
    return <span className="text-gray-200">{String(val)}</span>;
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-500" />;
    if (sortDir === "asc") return <ChevronUp className="w-3 h-3 text-indigo-400" />;
    return <ChevronDown className="w-3 h-3 text-indigo-400" />;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-gray-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
          />
        </div>
        {onAdd && (
          <Button
            onClick={onAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-700/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60">
              <tr>
                {entityConfig.fields.map((field) => (
                  <th
                    key={field.name}
                    className="px-4 py-3 text-left font-medium text-gray-300 cursor-pointer hover:bg-gray-700/30 transition-colors select-none"
                    onClick={() => handleSort(field.name)}
                  >
                    <div className="flex items-center gap-1.5">
                      {field.label}
                      <SortIcon field={field.name} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-gray-300 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={entityConfig.fields.length + 1} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                        <Search className="w-5 h-5 text-gray-500" />
                      </div>
                      <p className="text-gray-500">{search ? "No records match your search" : "No records yet"}</p>
                      {!search && onAdd && (
                        <Button
                          onClick={onAdd}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add first record
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((record, i) => (
                  <tr
                    key={record.id}
                    className={`border-t border-gray-700/20 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? "bg-gray-900/10" : ""}`}
                  >
                    {entityConfig.fields.map((field) => (
                      <td key={field.name} className="px-4 py-3">
                        {renderCellValue(record, field.name, field.type)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(record)}
                            className="w-7 h-7 p-0 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(record)}
                            className="w-7 h-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 p-0 border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 p-0 border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
