"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { guestStore } from "@/lib/guestStore";
import { DOMAINS, STATUSES } from "@/lib/types";
import type { Domain, Status } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  vaultId?: string;
  authorId?: string;
  guest?: boolean;
}

export default function AddIdeaModal({ onClose, onSaved, vaultId, authorId, guest = false }: Props) {
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

    if (guest) {
      guestStore.add({ content: content.trim(), domain, status });
      toast.success("Saved on this device");
      onSaved();
      setLoading(false);
      return;
    }

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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ zIndex: "var(--z-backdrop)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          role="dialog" aria-modal="true" aria-label="New idea"
          className="panel rounded-2xl w-full max-w-lg p-6 shadow-2xl"
          style={{ zIndex: "var(--z-modal)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>New idea</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>Add context, pick a domain and status</p>
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your idea in as much or as little detail as you want…"
              aria-label="Idea description"
              rows={5}
              autoFocus
              disabled={loading}
              className="input-field p-3.5 text-sm resize-none disabled:opacity-60 leading-relaxed"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value as Domain)}
                  disabled={loading}
                  className="input-field px-3 py-2.5 text-sm disabled:opacity-60"
                >
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  disabled={loading}
                  className="input-field px-3 py-2.5 text-sm disabled:opacity-60"
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
                className="px-4 py-2.5 text-sm transition-colors disabled:opacity-40"
                style={{ color: "var(--text-2)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="btn-accent px-5 py-2.5 text-sm"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save idea"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
