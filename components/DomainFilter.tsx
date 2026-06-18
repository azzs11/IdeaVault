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
          <button key={domain} onClick={() => onChange(domain as Domain | "All")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
            style={{
              background: isActive ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
              color: isActive ? "#a5b4fc" : "#475569",
            }}>
            {domain}
            {count !== undefined && (
              <span className="text-[10px] rounded-full px-1.5 py-0.5"
                style={{
                  background: isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  color: isActive ? "#c7d2fe" : "#334155",
                }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
