import { DOMAINS } from "@/lib/types";
import type { Domain } from "@/lib/types";

interface Props {
  active: Domain | "All";
  onChange: (domain: Domain | "All") => void;
  counts: Partial<Record<Domain | "All", number>>;
}

export default function DomainFilter({ active, onChange, counts }: Props) {
  const all = ["All", ...DOMAINS] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((domain) => {
        const isActive = active === domain;
        const count = counts[domain];

        return (
          <button
            key={domain}
            onClick={() => onChange(domain as Domain | "All")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isActive
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
            }`}
          >
            {domain}
            {count !== undefined && (
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 ${
                  isActive ? "bg-indigo-500 text-white" : "bg-gray-800 text-gray-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
