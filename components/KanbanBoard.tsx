"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { guestStore, GUEST_CHANGED_EVENT } from "@/lib/guestStore";
import { STATUSES, STATUS_COLOR } from "@/lib/types";
import type { Idea, Domain, Status } from "@/lib/types";

const SPRING = { type: "spring", stiffness: 480, damping: 38, mass: 0.7 } as const;

function SkeletonKanbanCard() {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}>
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

interface Props { refreshKey: number; vaultId?: string; guest?: boolean; }

export default function KanbanBoard({ refreshKey, vaultId, guest = false }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Partial<Record<Status, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (guest) {
      const load = () => { setIdeas(guestStore.list()); setLoading(false); };
      load();
      window.addEventListener(GUEST_CHANGED_EVENT, load);
      return () => window.removeEventListener(GUEST_CHANGED_EVENT, load);
    }
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
  }, [refreshKey, vaultId, guest]);

  /** Which column sits under the pointer right now. */
  function columnAtPoint(x: number, y: number): Status | null {
    for (const s of STATUSES) {
      const el = colRefs.current[s];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return s;
    }
    return null;
  }

  async function move(ideaId: string, status: Status) {
    setIdeas((prev) => prev.map((i) => (i.id === ideaId ? { ...i, status } : i)));
    if (guest) guestStore.updateStatus(ideaId, status);
    else await supabase.from("ideas").update({ status }).eq("id", ideaId);
  }

  function onCardDrag(_e: unknown, info: PanInfo) {
    setDragOverCol(columnAtPoint(info.point.x, info.point.y));
  }

  function onCardDragEnd(idea: Idea, info: PanInfo) {
    setDraggingId(null);
    const target = columnAtPoint(info.point.x, info.point.y);
    setDragOverCol(null);
    if (target && target !== idea.status) move(idea.id, target);
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
    <div className="relative" ref={boardRef}>
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10"
        style={{ background: "linear-gradient(to right, var(--bg), transparent)" }} />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10"
        style={{ background: "linear-gradient(to left, var(--bg), transparent)" }} />

      <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6">
        {STATUSES.map((status) => {
          const col = ideas.filter((i) => i.status === status);
          const isOver = dragOverCol === status && draggingId !== null;
          const accent = STATUS_COLOR[status];

          return (
            <div
              key={status}
              ref={(el) => { colRefs.current[status] = el; }}
              className="flex-shrink-0 w-72 flex flex-col gap-2"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isOver ? "var(--accent-line)" : "var(--border)"}`,
                }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{status}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-2)" }}>
                  {col.length}
                </span>
              </div>

              {/* Drop zone */}
              <div className="flex flex-col gap-2 min-h-24 rounded-xl p-1.5 transition-colors duration-200"
                style={{
                  border: `1px dashed ${isOver ? "var(--accent-line)" : "transparent"}`,
                  background: isOver ? "var(--accent-soft)" : "transparent",
                }}>
                {col.length === 0 && !isOver && (
                  <p className="text-[11px] text-center py-6" style={{ color: "var(--text-3)" }}>Drop here</p>
                )}
                {col.map((idea) => (
                  <motion.div
                    key={idea.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING}
                    drag
                    dragConstraints={boardRef}
                    dragElastic={0.12}
                    dragMomentum={false}
                    dragSnapToOrigin
                    onDragStart={() => setDraggingId(idea.id)}
                    onDrag={onCardDrag}
                    onDragEnd={(_e, info) => onCardDragEnd(idea, info)}
                    whileDrag={{ scale: 1.04, boxShadow: "0 16px 44px rgba(0,0,0,0.55)", cursor: "grabbing", zIndex: 50 }}
                    className="relative select-none cursor-grab rounded-xl p-3 flex flex-col gap-2"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      touchAction: "none",
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                        {(idea as Idea & { domain: Domain }).domain}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                        {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "var(--ink)" }}>{idea.content}</p>
                    {idea.author?.name && <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{idea.author.name}</p>}
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
