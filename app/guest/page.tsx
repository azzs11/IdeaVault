"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shuffle, LayoutGrid, Columns, Sparkles, ArrowRight, Plus, Search, ListFilter } from "lucide-react";
import { guestStore, GUEST_CHANGED_EVENT } from "@/lib/guestStore";
import QuickAdd from "@/components/QuickAdd";
import AddIdeaModal from "@/components/AddIdeaModal";
import IdeaGrid from "@/components/IdeaGrid";
import KanbanBoard from "@/components/KanbanBoard";
import RandomPicker from "@/components/RandomPicker";
import CommandPalette, { type Command } from "@/components/CommandPalette";
import { useCommandPalette } from "@/lib/useCommandPalette";
import { withViewTransition } from "@/lib/viewTransition";
import { STATUSES, STATUS_COLOR, type Domain, type Status } from "@/lib/types";

type View = "grid" | "kanban";

export default function GuestPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<View>("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [activeStatus, setActiveStatus] = useState<Status | "All">("All");
  const [activeDomain, setActiveDomain] = useState<Domain | "All">("All");
  const [query, setQuery] = useState("");
  const palette = useCommandPalette();
  const router = useRouter();

  useEffect(() => {
    const sync = () => setCount(guestStore.count());
    sync();
    window.addEventListener(GUEST_CHANGED_EVENT, sync);
    return () => window.removeEventListener(GUEST_CHANGED_EVENT, sync);
  }, []);

  function refresh() { setRefreshKey((k) => k + 1); }
  function goSignUp() { router.push("/auth"); }
  const switchView = (v: View) => withViewTransition(() => setView(v));

  const commands = useMemo<Command[]>(() => [
    { id: "add", group: "Create", label: "Add idea", icon: Plus, keywords: "new capture note", run: () => setIsModalOpen(true) },
    { id: "view-grid", group: "View", label: "Switch to Grid", icon: LayoutGrid, keywords: "cards", run: () => switchView("grid") },
    { id: "view-board", group: "View", label: "Switch to Board", icon: Columns, keywords: "kanban columns", run: () => switchView("kanban") },
    { id: "random", group: "Tools", label: "Pick a random idea", icon: Shuffle, keywords: "surprise shuffle", run: () => setIsPickerOpen(true) },
    { id: "filter-all", group: "Filter by status", label: "All statuses", icon: ListFilter, keywords: "clear reset", run: () => { switchView("grid"); setActiveStatus("All"); } },
    ...STATUSES.map((s) => ({
      id: `filter-${s}`, group: "Filter by status", label: s, dot: STATUS_COLOR[s],
      keywords: "status filter", run: () => { switchView("grid"); setActiveStatus(s); },
    })),
    { id: "signup", group: "Account", label: "Sign up to save", icon: Sparkles, keywords: "account sync save", run: goSignUp },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <main className="min-h-screen">
      {/* Sticky nav */}
      <header className="sticky top-0 border-b border-white/[0.06]"
        style={{ zIndex: "var(--z-sticky)", background: "rgba(10,10,11,0.82)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
              <span className="text-[10px] font-bold" style={{ color: "var(--on-accent)" }}>IV</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>IdeaVault</span>
            <span className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-3)" }}>Guest</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Command palette trigger */}
            <button onClick={() => palette.setOpen(true)} aria-label="Open command palette"
              className="hidden sm:flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border border-white/[0.08] text-xs transition-all hover:border-white/20"
              style={{ background: "rgba(255,255,255,0.02)", color: "var(--text-3)" }}>
              <Search size={12} />
              <span>Search</span>
              <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-3)" }}>⌘K</kbd>
            </button>

            {/* View toggle */}
            <div className="flex border border-white/[0.08] rounded-lg p-0.5 gap-0.5" style={{ background: "rgba(255,255,255,0.03)" }}>
              {([["grid", LayoutGrid], ["kanban", Columns]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => switchView(v)} aria-pressed={view === v}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{ background: view === v ? "rgba(255,255,255,0.09)" : "transparent", color: view === v ? "var(--ink)" : "var(--text-3)" }}>
                  <Icon size={12} />
                  <span className="hidden sm:inline capitalize">{v === "kanban" ? "Board" : "Grid"}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setIsPickerOpen(true)} title="Surprise me" aria-label="Pick a random idea"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] transition-all hover:border-white/20"
              style={{ background: "rgba(255,255,255,0.02)", color: "var(--text-2)" }}>
              <Shuffle size={13} />
            </button>

            <button onClick={() => setIsModalOpen(true)} className="btn-accent px-3 py-1.5 text-xs">
              + New
            </button>

            <button onClick={goSignUp} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.12] transition-all hover:border-white/25"
              style={{ color: "var(--ink)", background: "rgba(255,255,255,0.03)" }}>
              Sign up
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="pt-14 pb-6 text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-3" style={{ color: "var(--ink)", textWrap: "balance" }}>
            Your ideas
          </h1>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Capture it now, sort it later. Sign up when you want to sync and share.
          </p>
        </motion.div>

        {/* Save-your-work banner */}
        <motion.button
          onClick={goSignUp}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="group w-full mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all"
          style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
            <Sparkles size={15} style={{ color: "var(--on-accent)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              {count > 0
                ? `${count} idea${count === 1 ? "" : "s"} saved on this device`
                : "Ideas are saved on this device"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>
              Sign up to back them up, open them anywhere, and invite collaborators.
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: "var(--accent)" }}>
            Sign up
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </motion.button>

        {/* QuickAdd */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <QuickAdd guest onSaved={refresh} />
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.26, duration: 0.45 }}>
          {view === "grid"
            ? <IdeaGrid guest refreshKey={refreshKey}
                activeStatus={activeStatus} onStatusChange={setActiveStatus}
                activeDomain={activeDomain} onDomainChange={setActiveDomain}
                query={query} onQueryChange={setQuery} />
            : <KanbanBoard guest refreshKey={refreshKey} />}
        </motion.div>
      </div>

      {isModalOpen && (
        <AddIdeaModal guest onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); refresh(); }} />
      )}
      {isPickerOpen && (
        <RandomPicker guest onClose={() => setIsPickerOpen(false)} />
      )}

      <CommandPalette open={palette.open} onClose={() => palette.setOpen(false)} commands={commands} />
    </main>
  );
}
