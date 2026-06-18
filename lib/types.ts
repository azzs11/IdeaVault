export const DOMAINS = [
  "Tech",
  "Product",
  "Business",
  "Design",
  "Personal",
  "Research",
  "Other",
] as const;

export type Domain = (typeof DOMAINS)[number];

export const STATUSES = [
  "New",
  "Exploring",
  "Building",
  "Shipped",
  "Archived",
] as const;

export type Status = (typeof STATUSES)[number];

/** One meaningful color axis: each status owns a distinct hue so a board reads at a glance. */
export const STATUS_COLOR: Record<Status, string> = {
  New:       "#9CA3AF", // neutral — unprocessed
  Exploring: "#38BDF8", // sky — curiosity
  Building:  "#F5A524", // gold — the active spark (brand accent)
  Shipped:   "#34D399", // emerald — done
  Archived:  "#6B6B70", // muted — set aside
};

export interface Idea {
  id: string;
  content: string;
  domain: Domain;
  status: Status;
  summary: string | null;
  vault_id: string;
  author_id: string | null;
  author?: { name: string } | null;
  created_at: string;
}

export interface Comment {
  id: string;
  idea_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { name: string } | null;
}

export interface Vault {
  id: string;
  name: string;
  code: string;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  created_at: string;
}
