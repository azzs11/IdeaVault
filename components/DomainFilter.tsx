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
            aria-pressed={isActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
            style={{
              background: isActive ? "var(--accent-soft)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? "var(--accent-line)" : "var(--border)"}`,
              color: isActive ? "var(--accent)" : "var(--text-2)",
            }}>
            {domain}
            {count !== undefined && (
              <span className="text-[10px] rounded-full px-1.5 py-0.5"
                style={{
                  background: isActive ? "rgba(245,165,36,0.2)" : "rgba(255,255,255,0.05)",
                  color: isActive ? "var(--accent-hi)" : "var(--text-3)",
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
