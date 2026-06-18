"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { STATUSES } from "@/lib/types";
import type { Idea, Domain, Status } from "@/lib/types";

function SkeletonKanbanCard() {
  return (
    <div className="rounded-xl p-3" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex justify-between mb-2">
        <div className="h-4 w-14 rounded-full shimmer" />
        <div className="h-3 w-10 rounded shimmer" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 rounded shimmer" />
        <div className="h-3 rounded shimmer w-4/5" />
      </div>
    </div>
  );
}

const STATUS_ACCENT: Record<Status, string> = {
  New:       "rgba(99,102,241,0.6)",
  Exploring: "rgba(139,92,246,0.6)",
  Building:  "rgba(99,102,241,0.9)",
  Shipped:   "rgba(255,255,255,0.7)",
  Archived:  "rgba(71,85,105,0.5)",
};

interface Props { refreshKey: number; vaultId: string; }

export default function KanbanBoard({ refreshKey, vaultId }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data } = await supabase.from("ideas")
        .select("*, author:profiles!ideas_author_id_fkey(name)")
        .eq("vault_id", vaultId)
        .order("created_at", { ascending: false });
      setIdeas((data as Idea[]) ?? []);
      setLoading(false);
    }
    fetchIdeas();
  }, [refreshKey, vaultId]);

  async function handleDrop(e: React.DragEvent, status: Status) {
    e.preventDefault();
    setDragOverCol(null);
    const ideaId = e.dataTransfer.getData("ideaId");
    if (!ideaId) return;
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || idea.status === status) return;
    setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, status } : i)));
    await supabase.from("ideas").update({ status }).eq("id", ideaId);
  }

  if (loading) return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map((s) => (
        <div key={s} className="flex-shrink-0 w-64 flex flex-col gap-3">
          <div className="h-8 rounded-xl shimmer" />
          {Array.from({length:2}).map((_,i) => <SkeletonKanbanCard key={i} />)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10"
        style={{ background: "linear-gradient(to right, #070B12, transparent)" }} />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10"
        style={{ background: "linear-gradient(to left, #070B12, transparent)" }} />

      <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6">
        {STATUSES.map((status) => {
          const col = ideas.filter((i) => i.status === status);
          const isOver = dragOverCol === status;
          const accent = STATUS_ACCENT[status];

          return (
            <div key={status} className="flex-shrink-0 w-72 flex flex-col gap-2"
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, status)}>

              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                  <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{status}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                  {col.length}
                </span>
              </div>

              {/* Drop zone */}
              <div className="flex flex-col gap-2 min-h-16 rounded-xl p-1.5 transition-all duration-200"
                style={{
                  border: isOver ? "1px dashed rgba(99,102,241,0.4)" : "1px dashed transparent",
                  background: isOver ? "rgba(99,102,241,0.04)" : "transparent",
                }}>
                {col.length === 0 && !isOver && (
                  <p className="text-[11px] text-center py-6" style={{ color: "#1e293b" }}>Drop here</p>
                )}
                {col.map((idea, index) => (
                  <motion.div key={idea.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    draggable
                    onDragStart={(e) => { (e as unknown as React.DragEvent).dataTransfer.setData("ideaId", idea.id); setDraggingId(idea.id); }}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    className="select-none cursor-grab active:cursor-grabbing rounded-xl p-3 flex flex-col gap-2 transition-all"
                    style={{
                      background: "#0D1117",
                      border: "1px solid rgba(255,255,255,0.06)",
                      opacity: draggingId === idea.id ? 0.3 : 1,
                      transform: draggingId === idea.id ? "scale(0.96)" : "scale(1)",
                      boxShadow: draggingId === idea.id ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {(idea as Idea & { domain: Domain }).domain}
                      </span>
                      <span className="text-[10px]" style={{ color: "#1e293b" }}>
                        {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "#cbd5e1" }}>{idea.content}</p>
                    {idea.author?.name && <p className="text-[10px]" style={{ color: "#1e293b" }}>{idea.author.name}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
