"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { STATUSES } from "@/lib/types";
import type { Idea, Domain, Status } from "@/lib/types";

const DOMAIN_COLORS: Record<Domain, string> = {
  Tech: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Product: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Business: "bg-green-500/20 text-green-300 border-green-500/30",
  Design: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Personal: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Research: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const COLUMN_STYLES: Record<Status, { header: string; drop: string; count: string }> = {
  New: {
    header: "text-sky-300 border-sky-500/30",
    drop: "border-sky-500/40 bg-sky-500/5",
    count: "bg-sky-500/20 text-sky-300",
  },
  Exploring: {
    header: "text-amber-300 border-amber-500/30",
    drop: "border-amber-500/40 bg-amber-500/5",
    count: "bg-amber-500/20 text-amber-300",
  },
  Building: {
    header: "text-violet-300 border-violet-500/30",
    drop: "border-violet-500/40 bg-violet-500/5",
    count: "bg-violet-500/20 text-violet-300",
  },
  Shipped: {
    header: "text-emerald-300 border-emerald-500/30",
    drop: "border-emerald-500/40 bg-emerald-500/5",
    count: "bg-emerald-500/20 text-emerald-300",
  },
  Archived: {
    header: "text-gray-400 border-gray-600/30",
    drop: "border-gray-600/40 bg-gray-500/5",
    count: "bg-gray-700 text-gray-400",
  },
};

interface Props {
  refreshKey: number;
  vaultId: string;
}

export default function KanbanBoard({ refreshKey, vaultId }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data } = await supabase
        .from("ideas")
        .select("*, author:profiles!ideas_author_id_fkey(name)")
        .eq("vault_id", vaultId)
        .order("created_at", { ascending: false });
      setIdeas((data as Idea[]) ?? []);
      setLoading(false);
    }
    fetchIdeas();
  }, [refreshKey, vaultId]);

  function handleDragStart(e: React.DragEvent, ideaId: string) {
    e.dataTransfer.setData("ideaId", ideaId);
    setDraggingId(ideaId);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleDragOver(e: React.DragEvent, status: Status) {
    e.preventDefault();
    setDragOverCol(status);
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  async function handleDrop(e: React.DragEvent, status: Status) {
    e.preventDefault();
    setDragOverCol(null);
    const ideaId = e.dataTransfer.getData("ideaId");
    if (!ideaId) return;

    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || idea.status === status) return;

    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status } : i))
    );

    await supabase.from("ideas").update({ status }).eq("id", ideaId);
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((s) => (
          <div key={s} className="flex-shrink-0 w-64 bg-gray-900 border border-gray-800 rounded-xl p-4 h-96 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6">
      {STATUSES.map((status) => {
        const col = ideas.filter((i) => i.status === status);
        const styles = COLUMN_STYLES[status];
        const isOver = dragOverCol === status;

        return (
          <div
            key={status}
            className="flex-shrink-0 w-72 flex flex-col gap-3"
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${styles.header}`}>
              <span className="text-sm font-semibold">{status}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.count}`}>
                {col.length}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={`flex flex-col gap-2 min-h-32 rounded-xl border-2 border-dashed p-2 transition-colors ${
                isOver ? styles.drop : "border-transparent"
              }`}
            >
              {col.length === 0 && !isOver && (
                <p className="text-xs text-gray-600 text-center mt-4">Drop ideas here</p>
              )}

              {col.map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idea.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-gray-900 border border-gray-800 rounded-xl p-3 cursor-grab active:cursor-grabbing flex flex-col gap-2 transition-all select-none ${
                    draggingId === idea.id ? "opacity-40 scale-95" : "hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other}`}>
                      {idea.domain}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <p className="text-gray-100 text-xs leading-relaxed line-clamp-4">{idea.content}</p>

                  {idea.author?.name && (
                    <p className="text-xs text-gray-600">{idea.author.name}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
