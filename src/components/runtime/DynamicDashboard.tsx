"use client";

import { ComponentConfig, DynamicRecord, AppConfig } from "@/types/config.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { aggregateEntityData, groupByField } from "@/lib/runtime-engine";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

interface DynamicDashboardProps {
  components: ComponentConfig[];
  appConfig: AppConfig;
  entityData: Record<string, DynamicRecord[]>;
  loading?: boolean;
}

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
}

function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <Card className="bg-gray-800/40 border-gray-700/30 hover:bg-gray-800/60 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
          <TrendingUp className="w-3 h-3" />
          <span>Live from config</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  data: { name: string; value: number }[];
  type: "bar" | "line";
}

function ChartCard({ title, data, type }: ChartCardProps) {
  return (
    <Card className="bg-gray-800/40 border-gray-700/30 col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
              />
              <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
              />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={{ fill: "#6366F1" }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DataTableWidget({
  title,
  data,
  columns,
}: {
  title: string;
  data: DynamicRecord[];
  columns: string[];
}) {
  const last5 = data.slice(-5).reverse();
  return (
    <Card className="bg-gray-800/40 border-gray-700/30 col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-gray-400 font-medium border-b border-gray-700/30">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last5.map((row, i) => (
                <tr key={i} className="border-t border-gray-700/10">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-gray-300">
                      {String(row[col] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {last5.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-4 text-center text-gray-500">
                    No data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DynamicDashboard({
  components,
  appConfig,
  entityData,
  loading = false,
}: DynamicDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 bg-gray-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  const renderComponent = (comp: ComponentConfig) => {
    const data = comp.entity ? (entityData[comp.entity] ?? []) : [];

    switch (comp.type) {
      case "stats-card": {
        const value = aggregateEntityData(
          data as Record<string, unknown>[],
          comp.field,
          comp.aggregation
        );
        return (
          <StatsCard
            key={comp.id}
            title={comp.title ?? comp.id}
            value={comp.aggregation === "avg" ? value.toFixed(2) : value}
            subtitle={comp.entity ? `from ${comp.entity}` : undefined}
          />
        );
      }

      case "bar-chart": {
        const chartData = comp.field
          ? groupByField(data as Record<string, unknown>[], comp.field)
          : [];
        return (
          <ChartCard
            key={comp.id}
            title={comp.title ?? "Bar Chart"}
            data={chartData}
            type="bar"
          />
        );
      }

      case "line-chart": {
        const chartData = comp.field
          ? groupByField(data as Record<string, unknown>[], comp.field)
          : data.map((_, i) => ({ name: String(i + 1), value: 1 }));
        return (
          <ChartCard
            key={comp.id}
            title={comp.title ?? "Line Chart"}
            data={chartData}
            type="line"
          />
        );
      }

      case "data-table": {
        const entityConf = appConfig.entities.find((e) => e.name === comp.entity);
        const columns = entityConf?.fields.map((f) => f.name).slice(0, 4) ?? [];
        return (
          <DataTableWidget
            key={comp.id}
            title={comp.title ?? "Recent Records"}
            data={data}
            columns={columns}
          />
        );
      }

      default:
        return (
          <Card key={comp.id} className="bg-gray-800/40 border-gray-700/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-32 gap-2">
              <AlertCircle className="w-6 h-6 text-gray-500" />
              <p className="text-xs text-gray-500">
                Unsupported component type: <code>{comp.type}</code>
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {components.map(renderComponent)}
    </div>
  );
}
