"use client";

import { useEffect, useState } from "react";
import IdeaCard from "./IdeaCard";
import { supabase } from "@/lib/supabase";
import type { Idea } from "@/lib/types";

export default function IdeaGrid({ refreshKey }: { refreshKey: number }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    return <p className="text-red-400 text-sm mt-6">Failed to load ideas: {error}</p>;
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center mt-24">
        <p className="text-gray-500 text-lg">No ideas yet.</p>
        <p className="text-gray-600 text-sm mt-1">Hit &ldquo;+ New Idea&rdquo; to add your first one.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}
