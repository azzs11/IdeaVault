"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Lightbulb } from "lucide-react";
import IdeaCard from "./IdeaCard";
import DomainFilter from "./DomainFilter";
import { supabase } from "@/lib/supabase";
import { DOMAINS, STATUSES } from "@/lib/types";
import type { Idea, Domain, Status } from "@/lib/types";

interface Props { refreshKey: number; vaultId: string; userId: string; }

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-5 w-16 rounded-full shimmer" />
          <div className="h-4 w-20 rounded shimmer" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3.5 rounded shimmer" />
          <div className="h-3.5 rounded shimmer w-5/6" />
          <div className="h-3.5 rounded shimmer w-3/4" />
        </div>
        <div className="pt-2 flex justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="h-4 w-24 rounded-full shimmer" />
          <div className="h-4 w-12 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function IdeaGrid({ refreshKey, vaultId, userId }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDomain, setActiveDomain] = useState<Domain | "All">("All");
  const [activeStatus, setActiveStatus] = useState<Status | "All">("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ideas")
        .select("*, author:profiles!ideas_author_id_fkey(name)")
        .eq("vault_id", vaultId)
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setIdeas((data as Idea[]) ?? []);
      setLoading(false);
    }
    fetchIdeas();
  }, [refreshKey, vaultId]);

  const q = query.trim().toLowerCase();
  const filtered = ideas
    .filter((i) => activeDomain === "All" || i.domain === activeDomain)
    .filter((i) => activeStatus === "All" || i.status === activeStatus)
    .filter((i) => !q || i.content.toLowerCase().includes(q) || (i.summary?.toLowerCase().includes(q) ?? false) || i.domain.toLowerCase().includes(q) || (i.author?.name?.toLowerCase().includes(q) ?? false));

  const domainCounts: Partial<Record<Domain | "All", number>> = {
    All: ideas.filter((i) => activeStatus === "All" || i.status === activeStatus).length,
    ...Object.fromEntries(DOMAINS.map((d) => [d, ideas.filter((i) => i.domain === d && (activeStatus === "All" || i.status === activeStatus)).length])),
  };

  const statusCounts: Partial<Record<Status | "All", number>> = {
    All: ideas.filter((i) => activeDomain === "All" || i.domain === activeDomain).length,
    ...Object.fromEntries(STATUSES.map((s) => [s, ideas.filter((i) => i.status === s && (activeDomain === "All" || i.domain === activeDomain)).length])),
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="h-10 rounded-xl shimmer" />
      <div className="flex gap-2">{Array.from({length:6}).map((_,i) => <div key={i} className="h-7 w-20 rounded-full shimmer" />)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (error) return <p className="text-red-400 text-sm mt-6">Failed to load: {error}</p>;

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#334155" }} />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ideas…"
          className="w-full rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#e2e8f0" }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.35)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.07)")} />
        <AnimatePresence>
          {query && (
            <motion.button initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-slate-300"
              style={{ color: "#334155" }}>
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Status filter — all indigo */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => {
          const isActive = activeStatus === s;
          const count = statusCounts[s as Status | "All"];
          return (
            <button key={s} onClick={() => setActiveStatus(s as Status | "All")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: isActive ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
                color: isActive ? "#a5b4fc" : "#475569",
              }}>
              {s}
              {count !== undefined && (
                <span className="text-[10px] rounded-full px-1.5 py-0.5"
                  style={{ background: isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", color: isActive ? "#c7d2fe" : "#334155" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <DomainFilter active={activeDomain} onChange={setActiveDomain} counts={domainCounts} />

      <AnimatePresence mode="wait">
        {ideas.length === 0 ? (
          <motion.div key="empty-all" initial={{opacity:0}} animate={{opacity:1}} className="text-center py-28">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Lightbulb size={28} style={{ color: "#1e293b" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#475569" }}>Your vault is empty</p>
            <p className="text-sm" style={{ color: "#1e293b" }}>Type your first idea above and watch this space come alive</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty-filter" initial={{opacity:0}} animate={{opacity:1}} className="text-center py-24">
            <p className="font-medium" style={{ color: "#475569" }}>
              {q ? `No results for "${query}"` : "No ideas match these filters"}
            </p>
            <p className="text-sm mt-1" style={{ color: "#1e293b" }}>
              {q ? "Try different keywords" : "Try a different domain or status"}
            </p>
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{opacity:0}} animate={{opacity:1}}>
            <motion.p key={filtered.length} initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}}
              className="text-[11px] mb-3" style={{ color: "#334155" }}>
              {filtered.length} {filtered.length === 1 ? "idea" : "ideas"}{q && ` matching "${query}"`}
            </motion.p>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              initial="hidden" animate="show">
              {filtered.map((idea) => (
                <motion.div key={idea.id}
                  variants={{ hidden: { opacity:0, y:14 }, show: { opacity:1, y:0, transition: { duration:0.38, ease:[0.34,1.56,0.64,1] } } }}>
                  <IdeaCard idea={idea} userId={userId} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
