"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DOMAINS, STATUSES } from "@/lib/types";
import type { Domain, Status } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  vaultId: string;
  authorId: string;
}

export default function AddIdeaModal({ onClose, onSaved, vaultId, authorId }: Props) {
  const [content, setContent] = useState("");
  const [domain, setDomain] = useState<Domain>("Tech");
  const [status, setStatus] = useState<Status>("New");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("ideas").insert({
      content: content.trim(), domain, status,
      summary: null, vault_id: vaultId, author_id: authorId,
    });

    if (error) {
      toast.error("Failed to save idea");
    } else {
      toast.success("Idea saved!");
      onSaved();
    }
    setLoading(false);
  }

  return (
    <AnimatePresence>
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
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="glass-strong rounded-2xl w-full max-w-lg p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">New Idea</h2>
              <p className="text-xs text-slate-500 mt-0.5">Add context, pick a domain and status</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your idea in as much or as little detail as you want…"
              rows={5}
              autoFocus
              disabled={loading}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-60 leading-relaxed"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as Domain)}
                  disabled={loading}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-60"
                >
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  disabled={loading}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-60"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Idea"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
