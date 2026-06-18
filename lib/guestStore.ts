import type { Idea, Domain, Status } from "./types";

/**
 * Local-first store for guest mode. Ideas live in localStorage under one key
 * with the same shape as a Supabase `Idea`, so the same UI renders both modes.
 * On signup the captured ideas migrate into a real vault (see `guestIdeasForMigration`).
 */
const KEY = "ideavault:guest:ideas:v1";
export const GUEST_CHANGED_EVENT = "ideavault:guest-changed";

function read(): Idea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Idea[]) : [];
  } catch {
    return [];
  }
}

function write(ideas: Idea[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ideas));
  // Let any mounted view (grid, kanban, banner) re-read without prop drilling.
  window.dispatchEvent(new Event(GUEST_CHANGED_EVENT));
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const guestStore = {
  /** Newest first, matching the Supabase query order. */
  list(): Idea[] {
    return read().sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  count(): number {
    return read().length;
  },

  add(input: { content: string; domain: Domain; status?: Status }): Idea {
    const idea: Idea = {
      id: newId(),
      content: input.content,
      domain: input.domain,
      status: input.status ?? "New",
      summary: null,
      vault_id: "local",
      author_id: null,
      author: { name: "You" },
      created_at: new Date().toISOString(),
    };
    write([idea, ...read()]);
    return idea;
  },

  updateStatus(id: string, status: Status) {
    write(read().map((i) => (i.id === id ? { ...i, status } : i)));
  },

  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(GUEST_CHANGED_EVENT));
  },
};

/** Rows ready to insert into the `ideas` table for a freshly authed user + vault. */
export function guestIdeasForMigration(vaultId: string, userId: string) {
  return read().map((i) => ({
    content: i.content,
    domain: i.domain,
    status: i.status,
    summary: i.summary ?? null,
    vault_id: vaultId,
    author_id: userId,
    created_at: i.created_at,
  }));
}
