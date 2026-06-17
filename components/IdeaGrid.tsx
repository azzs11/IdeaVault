"use client";

import { useEffect, useState } from "react";
import IdeaCard from "./IdeaCard";
import DomainFilter from "./DomainFilter";
import { supabase } from "@/lib/supabase";
import { DOMAINS } from "@/lib/types";
import type { Idea, Domain } from "@/lib/types";

export default function IdeaGrid({ refreshKey }: { refreshKey: number }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDomain, setActiveDomain] = useState<Domain | "All">("All");

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setIdeas(data ?? []);
      }
      setLoading(false);
    }

    fetchIdeas();
  }, [refreshKey]);

  const filtered =
    activeDomain === "All"
      ? ideas
      : ideas.filter((i) => i.domain === activeDomain);

  const counts: Partial<Record<Domain | "All", number>> = {
    All: ideas.length,
    ...Object.fromEntries(
      DOMAINS.map((d) => [d, ideas.filter((i) => i.domain === d).length])
    ),
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-36 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-400 text-sm mt-6">Failed to load ideas: {error}</p>
    );
  }

  return (
    <div>
      <DomainFilter
        active={activeDomain}
        onChange={setActiveDomain}
        counts={counts}
      />

      {ideas.length === 0 ? (
        <div className="text-center mt-24">
          <p className="text-gray-500 text-lg">No ideas yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Hit &ldquo;+ New Idea&rdquo; to add your first one.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center mt-24">
          <p className="text-gray-500 text-lg">No {activeDomain} ideas yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Try a different filter or add a new idea.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mt-4 mb-1">
            {filtered.length} {filtered.length === 1 ? "idea" : "ideas"}
            {activeDomain !== "All" ? ` in ${activeDomain}` : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {filtered.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
