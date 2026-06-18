"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { guestStore } from "@/lib/guestStore";
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
  vaultId?: string;
  authorId?: string;
  guest?: boolean;
}

export default function QuickAdd({ onSaved, vaultId, authorId, guest = false }: Props) {
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

    if (guest) {
      guestStore.add({ content: content.trim(), domain });
      setContent("");
      setDomain("Tech");
      onSaved();
      toast.success("Saved on this device");
      setLoading(false);
      return;
    }

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
      className="panel rounded-2xl p-3 flex flex-col gap-3 mb-6"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture an idea before it's gone…"
          aria-label="Capture a new idea"
          disabled={loading}
          className="input-field flex-1 px-4 py-2.5 text-sm disabled:opacity-60"
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
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
              listening
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "border-white/[0.08] text-muted hover:text-ink hover:border-white/20 hover:bg-white/[0.04]"
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
          aria-label="Idea domain"
          className="input-field !w-auto px-3 py-1.5 text-xs disabled:opacity-60"
          style={{ color: "var(--text-2)" }}
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
          className="btn-accent px-4 py-1.5 text-xs"
        >
          <Send size={12} />
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
