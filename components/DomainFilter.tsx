import type { Domain } from "@/lib/types";
import { DOMAINS } from "@/lib/types";

interface Props {
  active: Domain | "All";
  onChange: (domain: Domain | "All") => void;
}

export default function DomainFilter({ active, onChange }: Props) {
  const all = ["All", ...DOMAINS] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((domain) => (
        <button
          key={domain}
          onClick={() => onChange(domain as Domain | "All")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
            active === domain
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
          }`}
        >
          {domain}
        </button>
      ))}
    </div>
  );
}
