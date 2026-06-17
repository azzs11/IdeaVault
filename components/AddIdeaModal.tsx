"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Domain } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

type Status = "idle" | "thinking" | "saving";

export default function AddIdeaModal({ onClose, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setStatus("thinking");

    let domain: Domain = "Other";
    let summary: string | null = null;

    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Categorization failed");
      }

      domain = json.domain as Domain;
      summary = json.summary ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI step failed");
      setStatus("idle");
      return;
    }

    setStatus("saving");

    const { error: dbError } = await supabase.from("ideas").insert({
      content: content.trim(),
      domain,
      summary,
    });

    if (dbError) {
      setError(dbError.message);
      setStatus("idle");
      return;
    }

    onSaved();
  }

  const buttonLabel: Record<Status, string> = {
    idle: "Save Idea",
    thinking: "Thinking…",
    saving: "Saving…",
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">New Idea</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              AI will categorize and summarize it for you
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your idea in any amount of detail…"
            rows={6}
            autoFocus
            disabled={status !== "idle"}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={status !== "idle"}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status !== "idle" || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px]"
            >
              {buttonLabel[status]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
