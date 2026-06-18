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
