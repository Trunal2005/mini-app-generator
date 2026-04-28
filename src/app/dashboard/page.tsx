"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Settings,
  ExternalLink,
  Trash2,
  Calendar,
  Database,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { generateConfigFromPrompt } from "@/lib/app-config-generator";

interface AppCard {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { entities: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState<AppCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDesc, setNewAppDesc] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      const res = await fetch("/api/apps");
      const data = await res.json();
      if (res.ok) setApps(data.apps);
    } catch {
      toast.error("Failed to load apps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleCreate = async () => {
    if (!newAppName.trim()) return;
    setCreating(true);
    try {
      const config = generateConfigFromPrompt(newAppName, newAppDesc);
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create app");
        return;
      }
      toast.success("App generated!");
      setCreateOpen(false);
      setNewAppName("");
      setNewAppDesc("");
      router.push(`/dashboard/apps/${data.app.id}/config`);
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove all data.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/apps/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApps((prev) => prev.filter((a) => a.id !== id));
        toast.success("App deleted");
      } else {
        toast.error("Failed to delete app");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Apps</h1>
          <p className="text-sm text-gray-400 mt-1">
            {apps.length} app{apps.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Create App
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#131b2e] border-gray-700/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-gray-100">Create New App</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-gray-300">App Name *</Label>
                <Input
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="My Employee Directory"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Describe the app or site</Label>
                <Textarea
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Example: Create a flappy bird game with a crown, or build an inventory dashboard for a shop."
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newAppName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {creating ? "Generating..." : "Generate App"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* App Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-gray-800/40 rounded-2xl" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No apps yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Create your first app by defining a JSON config. Forms, tables, and dashboards are generated automatically.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create your first app
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {apps.map((app) => (
            <div
              key={app.id}
              className="group relative rounded-2xl bg-[#131b2e] border border-gray-700/20 hover:border-gray-600/40 transition-all overflow-hidden"
            >
              {/* Top gradient bar */}
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base font-semibold text-gray-100 truncate">{app.name}</h3>
                    {app.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(app.id, app.name)}
                    disabled={deletingId === app.id}
                    className="w-7 h-7 p-0 text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="bg-gray-800 text-gray-400 border-0 text-xs gap-1">
                    <Database className="w-2.5 h-2.5" />
                    {app._count.entities} entities
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/apps/${app.id}/config`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white gap-1.5 text-xs"
                    >
                      <Settings className="w-3 h-3" />
                      Edit Config
                    </Button>
                  </Link>
                  <Link href={`/dashboard/apps/${app.id}`} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open App
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Create new card */}
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-2xl border-2 border-dashed border-gray-700/40 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center p-8 gap-3 group min-h-[180px]"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-600 group-hover:border-indigo-500/60 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
            </div>
            <span className="text-sm text-gray-600 group-hover:text-gray-400 transition-colors">
              Create new app
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
