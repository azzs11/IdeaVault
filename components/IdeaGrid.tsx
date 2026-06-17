"use client";

import { useState } from "react";
import IdeaCard from "./IdeaCard";
import DomainFilter from "./DomainFilter";
import type { Idea, Domain } from "@/lib/types";

interface Props {
  ideas: Idea[];
}

export default function IdeaGrid({ ideas }: Props) {
  const [activeDomain, setActiveDomain] = useState<Domain | "All">("All");

  const filtered = activeDomain === "All"
    ? ideas
    : ideas.filter((i) => i.domain === activeDomain);

  return (
    <div>
      <DomainFilter active={activeDomain} onChange={setActiveDomain} />

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 mt-16">No ideas yet. Add one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
