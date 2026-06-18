"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
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

const STATUS_COLORS: Record<Status, string> = {
  New: "text-sky-300",
  Exploring: "text-amber-300",
  Building: "text-violet-300",
  Shipped: "text-emerald-300",
  Archived: "text-gray-400",
};

interface Props {
  vaultId: string;
  onClose: () => void;
}

export default function RandomPicker({ vaultId, onClose }: Props) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(false);

  async function pickRandom() {
    setLoading(true);

    const { data } = await supabase
      .from("ideas")
      .select("*, author:profiles!ideas_author_id_fkey(name)")
      .eq("vault_id", vaultId)
      .neq("status", "Archived");

    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)];
      setIdea(random as Idea);
      setPicked(true);
    } else {
      setIdea(null);
      setPicked(true);
    }

    setLoading(false);
  }

  if (!picked) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl flex flex-col items-center gap-6">
          <div className="text-5xl">🎲</div>
          <div>
            <h2 className="text-xl font-bold text-gray-100">Surprise me</h2>
            <p className="text-gray-400 text-sm mt-1">Pick a random idea from your vault</p>
          </div>
          <button
            onClick={pickRandom}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? "Picking…" : "Pick an idea"}
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">Random pick</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        {!idea ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No ideas in your vault yet.</p>
            <p className="text-gray-600 text-sm mt-1">Add some ideas first!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other}`}>
                {idea.domain}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${STATUS_COLORS[idea.status] ?? STATUS_COLORS.New}`}>
                  {idea.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            <p className="text-gray-100 text-base leading-relaxed">{idea.content}</p>

            {idea.summary && (
              <p className="text-gray-400 text-sm italic border-l-2 border-gray-700 pl-3">{idea.summary}</p>
            )}

            {idea.author?.name && (
              <p className="text-xs text-gray-500">Added by {idea.author.name}</p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-800">
          <button
            onClick={pickRandom}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Picking…" : "🎲 Pick another"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
