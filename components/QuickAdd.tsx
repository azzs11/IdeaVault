"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import { toast } from "sonner";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input isn't supported in this browser. Try Chrome."); return; }

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

    const { error } = await supabase.from("ideas").insert({
      content: content.trim(), domain, status: "New",
      summary: null, vault_id: vaultId, author_id: authorId,
    });

    if (error) {
      toast.error("Failed to save idea");
    } else {
      setContent("");
      setDomain("Tech");
      onSaved();
      toast.success("Idea captured!");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-3 flex flex-col gap-3 mb-6"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture an idea instantly…"
          disabled={loading}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-60"
        />

        {/* Mic button */}
        <div className="relative">
          {listening && (
            <span className="absolute inset-0 rounded-xl bg-red-500/30 animate-ripple" />
          )}
          <button
            type="button"
            onClick={toggleVoice}
            title={listening ? "Stop listening" : "Speak your idea"}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
              listening
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "border-white/[0.08] text-slate-500 hover:text-slate-200 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value as Domain)}
          disabled={loading}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-60"
        >
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <AnimatePresence>
          {listening && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="text-xs text-red-400 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Listening…
            </motion.span>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-indigo-500/20"
        >
          <Send size={12} />
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
