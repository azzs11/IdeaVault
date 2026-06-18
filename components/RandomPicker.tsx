"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shuffle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { guestStore } from "@/lib/guestStore";
import { STATUS_COLOR } from "@/lib/types";
import type { Idea, Status } from "@/lib/types";

interface Props {
  vaultId?: string;
  onClose: () => void;
  guest?: boolean;
}

export default function RandomPicker({ vaultId, onClose, guest = false }: Props) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(false);
  const [pickCount, setPickCount] = useState(0);

  async function pickRandom() {
    setLoading(true);

    let pool: Idea[];
    if (guest) {
      pool = guestStore.list().filter((i) => i.status !== "Archived");
    } else {
      const { data } = await supabase
        .from("ideas")
        .select("*, author:profiles!ideas_author_id_fkey(name)")
        .eq("vault_id", vaultId)
        .neq("status", "Archived");
      pool = (data as Idea[]) ?? [];
    }

    setIdea(pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null);
    setPicked(true);
    setPickCount((c) => c + 1);
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: "var(--z-backdrop)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        role="dialog" aria-modal="true" aria-label="Random idea picker"
        className="panel rounded-2xl w-full max-w-lg p-6 shadow-2xl"
        style={{ zIndex: "var(--z-modal)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
              <Shuffle size={15} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Surprise me</h2>
              {pickCount > 0 && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Pick #{pickCount}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/[0.06]"
            style={{ color: "var(--text-2)" }}
          >
            <X size={16} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!picked ? (
            <motion.div key="initial" className="text-center py-8">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                className="text-5xl mb-4"
              >
                🎲
              </motion.div>
              <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>Pick a random non-archived idea from your vault</p>
              <button
                onClick={pickRandom}
                disabled={loading}
                className="btn-accent mx-auto px-6 py-3 text-sm"
              >
                {loading ? "Picking…" : <><Shuffle size={14} /> Pick an idea</>}
              </button>
            </motion.div>
          ) : !idea ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <p style={{ color: "var(--ink)" }}>No active ideas in your vault yet.</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>Add some ideas first.</p>
            </motion.div>
          ) : (
            <motion.div
              key={pickCount}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                    {idea.domain}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[idea.status as Status] }} />
                      {idea.status}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{idea.content}</p>

                {idea.summary && (
                  <p className="text-xs italic rounded-lg px-3 py-2" style={{ color: "var(--text-2)", background: "rgba(255,255,255,0.03)" }}>{idea.summary}</p>
                )}

                {idea.author?.name && (
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Added by {idea.author.name}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {picked && (
          <div className="flex gap-3 mt-5 pt-4 border-t border-white/[0.06]">
            <button
              onClick={pickRandom}
              disabled={loading}
              className="btn-accent flex-1 py-2.5 text-sm"
            >
              <Shuffle size={13} /> {loading ? "Picking…" : "Pick another"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm transition-colors"
              style={{ color: "var(--text-2)" }}
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
