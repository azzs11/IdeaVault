"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  hint?: string;        // right-aligned helper (e.g. shortcut or current value)
  group: string;
  icon?: LucideIcon;
  keywords?: string;    // extra search terms
  /** Optional swatch color rendered as a dot instead of an icon. */
  dot?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  placeholder?: string;
}

export default function CommandPalette({ open, onClose, commands, placeholder = "Type a command or search…" }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset on each open.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Focus after the entrance frame so the caret lands reliably.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [query, commands]);

  // Keep the active index in range as the list shrinks.
  useEffect(() => { setActive((a) => Math.min(a, Math.max(0, filtered.length - 1))); }, [filtered.length]);

  // Group while preserving a flat index for keyboard nav.
  const groups = useMemo(() => {
    const map = new Map<string, { cmd: Command; index: number }[]>();
    filtered.forEach((cmd, index) => {
      const arr = map.get(cmd.group) ?? [];
      arr.push({ cmd, index });
      map.set(cmd.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  function runAt(index: number) {
    const cmd = filtered[index];
    if (!cmd) return;
    onClose();
    // Let the palette close before the action (e.g. opening another modal).
    requestAnimationFrame(() => cmd.run());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  // Scroll the active row into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 flex items-start justify-center px-4 pt-[12vh]"
          style={{ zIndex: "var(--z-command)", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="dialog" aria-modal="true" aria-label="Command palette"
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}
          >
            {/* Search */}
            <div className="flex items-center gap-2.5 px-4" style={{ borderBottom: "1px solid var(--hairline)" }}>
              <Search size={16} style={{ color: "var(--text-3)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                aria-label="Command search"
                className="flex-1 bg-transparent py-3.5 text-sm focus:outline-none"
                style={{ color: "var(--ink)" }}
              />
              <kbd className="hidden sm:block text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-3)" }}>ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-3)" }}>
                  No commands match &ldquo;{query}&rdquo;
                </p>
              ) : (
                groups.map(([group, items]) => (
                  <div key={group} className="px-2 pb-1">
                    <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-3)" }}>{group}</p>
                    {items.map(({ cmd, index }) => {
                      const isActive = index === active;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          data-cmd-index={index}
                          role="option"
                          aria-selected={isActive}
                          onMouseMove={() => setActive(index)}
                          onClick={() => runAt(index)}
                          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                          style={{ background: isActive ? "var(--accent-soft)" : "transparent" }}
                        >
                          <span className="flex items-center justify-center w-5 shrink-0">
                            {cmd.dot
                              ? <span className="w-2 h-2 rounded-full" style={{ background: cmd.dot }} />
                              : Icon ? <Icon size={15} style={{ color: isActive ? "var(--accent)" : "var(--text-2)" }} /> : null}
                          </span>
                          <span className="flex-1 text-sm" style={{ color: isActive ? "var(--ink)" : "var(--text-2)" }}>
                            {cmd.label}
                          </span>
                          {cmd.hint && (
                            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{cmd.hint}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
