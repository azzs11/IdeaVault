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
  created_at: string;
}
