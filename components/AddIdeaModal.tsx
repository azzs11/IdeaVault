"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddIdeaModal({ onClose, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: content }),
      });

      const { domain, summary, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);

      const { error: dbError } = await supabase.from("ideas").insert({
        content: content.trim(),
        domain,
        summary,
      });

      if (dbError) throw new Error(dbError.message);

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Idea</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's the idea?"
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            autoFocus
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Saving…" : "Save Idea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
