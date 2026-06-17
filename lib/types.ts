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

export interface Idea {
  id: string;
  content: string;
  domain: Domain;
  summary: string | null;
  created_at: string;
}
