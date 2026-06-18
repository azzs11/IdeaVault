"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const vaultCode = await uniqueCode();

    // Ensure profile exists before vault FK constraint fires
    await supabase.from("profiles").upsert({ id: userId, name: "Anonymous" }, { onConflict: "id", ignoreDuplicates: true });

    const { data: vault, error: vaultError } = await supabase
      .from("vaults")
      .insert({ name: vaultName.trim(), code: vaultCode, created_by: userId })
      .select()
      .single();

    if (vaultError || !vault) {
      setError(vaultError?.message ?? "Failed to create vault");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("vault_members")
      .insert({ vault_id: vault.id, user_id: userId });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/vault/${vault.id}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: vault, error: vaultError } = await supabase
      .from("vaults")
      .select("id")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (vaultError || !vault) {
      setError("Vault not found. Double-check the code.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("vault_members")
      .insert({ vault_id: vault.id, user_id: userId });

    if (memberError && memberError.code !== "23505") {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/vault/${vault.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">IdeaVault</h1>
          <p className="text-gray-400 text-sm mt-2">Set up your idea space</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
            {(["create", "join"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === m ? "bg-gray-700 text-gray-100" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {m === "create" ? "Create vault" : "Join vault"}
              </button>
            ))}
          </div>

          {mode === "create" ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="Vault name (e.g. Our Ideas)"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500">
                A unique invite code will be generated. Share it with anyone you want to collaborate with.
              </p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || !vaultName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1"
              >
                {loading ? "Creating…" : "Create vault"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter vault code"
                required
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest"
              />
              <p className="text-xs text-gray-500">
                Ask the vault creator for their 6-character invite code.
              </p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.trim().length < 6}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-1"
              >
                {loading ? "Joining…" : "Join vault"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
