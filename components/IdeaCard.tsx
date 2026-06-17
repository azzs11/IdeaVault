"use client";

import { useState } from "react";
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

const STATUS_COLORS: Record<Status, string> = {
  New: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Exploring: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Building: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Shipped: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Archived: "bg-gray-500/20 text-gray-400 border-gray-600/30",
};

export default function IdeaCard({ idea }: { idea: Idea }) {
  const [status, setStatus] = useState<Status>(idea.status ?? "New");
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(next: Status) {
    setSaving(true);
    setStatus(next);
    await supabase.from("ideas").update({ status: next }).eq("id", idea.id);
    setSaving(false);
  }

  const domainColor = DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other;
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.New;

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors ${status === "Archived" ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${domainColor}`}>
          {idea.domain}
        </span>
        <span className="text-xs text-gray-500 shrink-0">
          {new Date(idea.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <p className="text-gray-100 text-sm leading-relaxed flex-1">{idea.content}</p>

      {idea.summary && (
        <p className="text-gray-400 text-xs italic border-t border-gray-800 pt-2">
          {idea.summary}
        </p>
      )}

      <div className="border-t border-gray-800 pt-2">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as Status)}
          disabled={saving}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors disabled:opacity-60 ${statusColor} bg-transparent`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-gray-900 text-gray-100">
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
