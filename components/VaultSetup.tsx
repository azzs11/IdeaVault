"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, LogIn, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const { data } = await supabase.from("vaults").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  return generateCode();
}

export default function VaultSetup({ userId }: { userId: string }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [vaultName, setVaultName] = useState("");
  const [codeChars, setCodeChars] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const router = useRouter();

  const joinCode = codeChars.join("").toUpperCase();

  function handleCodeChar(index: number, value: string) {
    const char = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-1);
    const next = [...codeChars];
    next[index] = char;
    setCodeChars(next);
    if (char && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !codeChars[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`);
      prev?.focus();
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    await supabase.from("profiles").upsert({ id: userId, name: "Anonymous" }, { onConflict: "id", ignoreDuplicates: true });
    const vaultCode = await uniqueCode();

    const { data: vault, error: vaultError } = await supabase
      .from("vaults")
      .insert({ name: vaultName.trim(), code: vaultCode, created_by: userId })
      .select().single();

    if (vaultError || !vault) {
      setError(vaultError?.message ?? "Failed to create vault");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("vault_members").insert({ vault_id: vault.id, user_id: userId });

    if (memberError) { setError(memberError.message); setLoading(false); return; }

    setCreatedCode(vaultCode);
    setTimeout(() => router.push(`/vault/${vault.id}`), 3000);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.length < 6) return;
    setLoading(true);
    setError("");

    const { data: vault, error: vaultError } = await supabase
      .from("vaults").select("id").eq("code", joinCode).single();

    if (vaultError || !vault) {
      setError("Vault not found. Double-check the code.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("vault_members").insert({ vault_id: vault.id, user_id: userId });

    if (memberError && memberError.code !== "23505") {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/vault/${vault.id}`);
  }

  function copyCreatedCode() {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (createdCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass-strong rounded-2xl p-8 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <Check size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gradient mb-1">Vault created!</h2>
            <p className="text-slate-500 text-sm mb-6">Share this code with collaborators</p>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-2">Invite code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-gradient-indigo tracking-[0.3em]">{createdCode}</span>
                <button onClick={copyCreatedCode} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {codeCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600">Redirecting to your vault…</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-xl font-bold text-white">IV</span>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Set up your vault</h1>
          <p className="text-slate-500 text-sm mt-1">Create a new one or join an existing vault</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-2xl">
          {/* Toggle */}
          <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 mb-6 relative">
            <motion.div
              className="absolute inset-y-1 rounded-lg bg-white/[0.08]"
              initial={false}
              animate={{ left: mode === "create" ? "4px" : "50%", right: mode === "create" ? "50%" : "4px" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {(["create", "join"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? "text-slate-100" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m === "create" ? <><Building2 size={13} /> Create</> : <><LogIn size={13} /> Join</>}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "create" ? (
              <motion.form
                key="create"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleCreate}
                className="flex flex-col gap-3"
              >
                <input
                  type="text"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                  placeholder="Vault name (e.g. Our Ideas)"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
                <p className="text-xs text-slate-600">A unique invite code will be generated to share with collaborators.</p>
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !vaultName.trim()}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/25 mt-1"
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create vault"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="join"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleJoin}
                className="flex flex-col gap-4"
              >
                <div>
                  <p className="text-xs text-slate-500 mb-3 text-center">Enter the 6-character vault code</p>
                  <div className="flex gap-2 justify-center">
                    {codeChars.map((char, i) => (
                      <input
                        key={i}
                        id={`code-${i}`}
                        type="text"
                        value={char}
                        onChange={(e) => handleCodeChar(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        maxLength={1}
                        className="w-10 h-12 text-center text-lg font-mono font-bold bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-all uppercase"
                      />
                    ))}
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || joinCode.length < 6}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Joining…</> : "Join vault"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
