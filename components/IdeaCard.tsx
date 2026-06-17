import type { Idea } from "@/lib/types";

const DOMAIN_COLORS: Record<string, string> = {
  Tech: "bg-blue-500/20 text-blue-300",
  Product: "bg-purple-500/20 text-purple-300",
  Business: "bg-green-500/20 text-green-300",
  Design: "bg-pink-500/20 text-pink-300",
  Personal: "bg-yellow-500/20 text-yellow-300",
  Research: "bg-orange-500/20 text-orange-300",
  Other: "bg-gray-500/20 text-gray-300",
};

interface Props {
  idea: Idea;
}

export default function IdeaCard({ idea }: Props) {
  const colorClass = DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
          {idea.domain}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(idea.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-gray-100 text-sm leading-relaxed">{idea.content}</p>
      {idea.summary && (
        <p className="text-gray-400 text-xs italic border-t border-gray-800 pt-2">{idea.summary}</p>
      )}
    </div>
  );
}
