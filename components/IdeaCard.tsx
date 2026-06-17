import type { Idea, Domain } from "@/lib/types";

const DOMAIN_COLORS: Record<Domain, string> = {
  Tech: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Product: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Business: "bg-green-500/20 text-green-300 border-green-500/30",
  Design: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Personal: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Research: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export default function IdeaCard({ idea }: { idea: Idea }) {
  const colorClass = DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${colorClass}`}>
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

      <p className="text-gray-100 text-sm leading-relaxed">{idea.content}</p>

      {idea.summary && (
        <p className="text-gray-400 text-xs italic border-t border-gray-800 pt-2">
          {idea.summary}
        </p>
      )}
    </div>
  );
}
