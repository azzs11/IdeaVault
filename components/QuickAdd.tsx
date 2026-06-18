"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { DOMAINS } from "@/lib/types";
import type { Domain } from "@/lib/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: new () => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: new () => any;
  }
}

interface Props {
  onSaved: () => void;
  vaultId: string;
  authorId: string;
}

export default function QuickAdd({ onSaved, vaultId, authorId }: Props) {
  const [content, setContent] = useState("");
  const [domain, setDomain] = useState<Domain>("Tech");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice input isn't supported in this browser. Try Chrome."); return; }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    const { error: dbError } = await supabase.from("ideas").insert({
      content: content.trim(),
      domain,
      status: "New",
      summary: null,
      vault_id: vaultId,
      author_id: authorId,
    });

    if (dbError) { setError(dbError.message); setLoading(false); return; }

    setContent("");
    setDomain("Tech");
    onSaved();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-700 rounded-xl p-3 flex flex-col gap-3 mb-6"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture an idea instantly…"
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
        />
        <button
          type="button"
          onClick={toggleVoice}
          title={listening ? "Stop listening" : "Speak your idea"}
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${
            listening
              ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
              : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value as Domain)}
          disabled={loading}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60"
        >
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-xs text-gray-600 flex-1">
          {listening ? "🎙 Listening…" : "Status defaults to New"}
        </span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  );
}
