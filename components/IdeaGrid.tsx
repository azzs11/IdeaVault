"use client";

import { useEffect, useState } from "react";
import IdeaCard from "./IdeaCard";
import DomainFilter from "./DomainFilter";
import { supabase } from "@/lib/supabase";
import { DOMAINS, STATUSES } from "@/lib/types";
import type { Idea, Domain, Status } from "@/lib/types";

interface Props {
  refreshKey: number;
  vaultId: string;
  userId: string;
}

export default function IdeaGrid({ refreshKey, vaultId, userId }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDomain, setActiveDomain] = useState<Domain | "All">("All");
  const [activeStatus, setActiveStatus] = useState<Status | "All">("All");

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ideas")
        .select("*, author:profiles!ideas_author_id_fkey(name)")
        .eq("vault_id", vaultId)
        .order("created_at", { ascending: false });

      if (error) { setError(error.message); } else { setIdeas((data as Idea[]) ?? []); }
      setLoading(false);
    }

    fetchIdeas();
  }, [refreshKey, vaultId]);

  const filtered = ideas
    .filter((i) => activeDomain === "All" || i.domain === activeDomain)
    .filter((i) => activeStatus === "All" || i.status === activeStatus);

  const domainCounts: Partial<Record<Domain | "All", number>> = {
    All: ideas.filter((i) => activeStatus === "All" || i.status === activeStatus).length,
    ...Object.fromEntries(
      DOMAINS.map((d) => [d, ideas.filter((i) => i.domain === d && (activeStatus === "All" || i.status === activeStatus)).length])
    ),
  };

  const statusCounts: Partial<Record<Status | "All", number>> = {
    All: ideas.filter((i) => activeDomain === "All" || i.domain === activeDomain).length,
    ...Object.fromEntries(
      STATUSES.map((s) => [s, ideas.filter((i) => i.status === s && (activeDomain === "All" || i.domain === activeDomain)).length])
    ),
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-red-400 text-sm mt-6">Failed to load ideas: {error}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => {
          const isActive = activeStatus === s;
          const count = statusCounts[s as Status | "All"];
          return (
            <button
              key={s}
              onClick={() => setActiveStatus(s as Status | "All")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
              }`}
            >
              {s}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? "bg-white/20 text-white" : "bg-gray-800 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts} />

      {ideas.length === 0 ? (
        <div className="text-center mt-24">
          <p className="text-gray-500 text-lg">No ideas yet.</p>
          <p className="text-gray-600 text-sm mt-1">Hit &ldquo;Save&rdquo; above to add your first one.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center mt-24">
          <p className="text-gray-500 text-lg">No ideas match these filters.</p>
          <p className="text-gray-600 text-sm mt-1">Try a different domain or status.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">{filtered.length} {filtered.length === 1 ? "idea" : "ideas"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} userId={userId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
