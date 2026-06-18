"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shuffle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Idea, Domain } from "@/lib/types";

const DOMAIN_COLORS: Record<Domain, string> = {
  Tech:     "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Product:  "bg-violet-500/15 text-violet-300 border-violet-500/25",
  Business: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Design:   "bg-pink-500/15 text-pink-300 border-pink-500/25",
  Personal: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Research: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  Other:    "bg-slate-500/15 text-slate-300 border-slate-500/25",
};

interface Props {
  vaultId: string;
  onClose: () => void;
}

export default function RandomPicker({ vaultId, onClose }: Props) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(false);
  const [pickCount, setPickCount] = useState(0);

  async function pickRandom() {
    setLoading(true);
    const { data } = await supabase
      .from("ideas")
      .select("*, author:profiles!ideas_author_id_fkey(name)")
      .eq("vault_id", vaultId)
      .neq("status", "Archived");

    if (data && data.length > 0) {
      setIdea(data[Math.floor(Math.random() * data.length)] as Idea);
    } else {
      setIdea(null);
    }
    setPicked(true);
    setPickCount((c) => c + 1);
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-strong rounded-2xl w-full max-w-lg p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Shuffle size={15} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Surprise me</h2>
              {pickCount > 0 && <p className="text-[11px] text-slate-500">Pick #{pickCount}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
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
              <p className="text-slate-400 mb-6 text-sm">Pick a random non-archived idea from your vault</p>
              <button
                onClick={pickRandom}
                disabled={loading}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
              >
                {loading ? "Picking…" : <><Shuffle size={14} /> Pick an idea</>}
              </button>
            </motion.div>
          ) : !idea ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <p className="text-slate-400">No active ideas in your vault yet.</p>
              <p className="text-slate-600 text-sm mt-1">Add some ideas first!</p>
            </motion.div>
          ) : (
            <motion.div
              key={pickCount}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col gap-4"
            >
              <div className="glass rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other}`}>
                    {idea.domain}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">{idea.status}</span>
                    <span className="text-[11px] text-slate-600">
                      {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <p className="text-slate-100 text-sm leading-relaxed">{idea.content}</p>

                {idea.summary && (
                  <p className="text-slate-500 text-xs italic border-l-2 border-white/10 pl-3">{idea.summary}</p>
                )}

                {idea.author?.name && (
                  <p className="text-[11px] text-slate-600">Added by {idea.author.name}</p>
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white text-sm font-medium transition-all"
            >
              <Shuffle size={13} /> {loading ? "Picking…" : "Pick another"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
