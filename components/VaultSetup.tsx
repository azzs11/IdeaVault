"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, LogIn, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { guestStore, guestIdeasForMigration } from "@/lib/guestStore";

/** Upload any locally-captured guest ideas into the vault, then clear local. */
async function migrateGuestIdeas(vaultId: string, userId: string) {
  const rows = guestIdeasForMigration(vaultId, userId);
  if (!rows.length) return;
  const { error } = await supabase.from("ideas").insert(rows);
  if (!error) guestStore.clear();
}

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

    await migrateGuestIdeas(vault.id, userId);

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

    await migrateGuestIdeas(vault.id, userId);

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
          <div className="panel rounded-2xl p-8 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#34D399", boxShadow: "0 8px 28px rgba(52,211,153,0.28)" }}>
              <Check size={24} style={{ color: "#06281C" }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--ink)" }}>Vault created</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>Share this code with collaborators</p>
            <div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>Invite code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-[0.3em]" style={{ color: "var(--accent)" }}>{createdCode}</span>
                <button onClick={copyCreatedCode} aria-label="Copy invite code" className="transition-colors" style={{ color: "var(--text-2)" }}>
                  {codeCopied ? <Check size={16} style={{ color: "#34D399" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Redirecting to your vault…</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent)", boxShadow: "0 8px 28px rgba(245,165,36,0.28)" }}>
            <span className="text-xl font-bold" style={{ color: "var(--on-accent)" }}>IV</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>Set up your vault</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>Create a new one or join an existing vault</p>
        </div>

        <div className="panel rounded-2xl p-6 shadow-2xl">
          {/* Toggle */}
          <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 mb-6 relative">
            <motion.div
              className="absolute inset-y-1 rounded-lg bg-white/[0.08]"
              initial={false}
              animate={{ left: mode === "create" ? "4px" : "50%", right: mode === "create" ? "50%" : "4px" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
            {(["create", "join"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: mode === m ? "var(--ink)" : "var(--text-2)" }}
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
                  className="input-field px-4 py-3 text-sm"
                />
                <p className="text-xs" style={{ color: "var(--text-3)" }}>A unique invite code will be generated to share with collaborators.</p>
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !vaultName.trim()}
                  className="btn-accent py-3 text-sm mt-1"
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
                  <p className="text-xs mb-3 text-center" style={{ color: "var(--text-2)" }}>Enter the 6-character vault code</p>
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
                        aria-label={`Code character ${i + 1}`}
                        className="input-field w-10 h-12 text-center text-lg font-mono font-bold uppercase"
                      />
                    ))}
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || joinCode.length < 6}
                  className="btn-accent py-3 text-sm"
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
