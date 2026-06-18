"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QuickAdd from "@/components/QuickAdd";
import AddIdeaModal from "@/components/AddIdeaModal";
import IdeaGrid from "@/components/IdeaGrid";
import KanbanBoard from "@/components/KanbanBoard";
import RandomPicker from "@/components/RandomPicker";

interface Vault {
  name: string;
  code: string;
}

type View = "grid" | "kanban";

export default function VaultPage({ params }: { params: { id: string } }) {
  const vaultId = params.id;
  const [vault, setVault] = useState<Vault | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<View>("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      setUserId(user.id);

      const [{ data: vaultData }, { data: profile }] = await Promise.all([
        supabase.from("vaults").select("name, code").eq("id", vaultId).single(),
        supabase.from("profiles").select("name").eq("id", user.id).single(),
      ]);

      if (!vaultData) { router.push("/"); return; }
      setVault(vaultData);
      setUserName(profile?.name ?? "");
    }

    init();
  }, [vaultId, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  function copyCode() {
    if (!vault) return;
    navigator.clipboard.writeText(vault.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  if (!vault || !userId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{vault.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-xs">Invite code:</span>
              <button
                onClick={copyCode}
                className="text-indigo-400 text-xs font-mono hover:text-indigo-300 transition-colors tracking-widest"
                title="Click to copy"
              >
                {vault.code}
              </button>
              {copied && <span className="text-green-400 text-xs">Copied!</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{userName}</span>

            {/* View toggle */}
            <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1 gap-1">
              <button
                onClick={() => setView("grid")}
                title="Grid view"
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "grid" ? "bg-gray-700 text-gray-100" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setView("kanban")}
                title="Kanban view"
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === "kanban" ? "bg-gray-700 text-gray-100" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                ☰ Board
              </button>
            </div>

            <button
              onClick={() => setIsPickerOpen(true)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-3 py-2 rounded-lg text-sm transition-colors"
              title="Surprise me"
            >
              🎲
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Detailed
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <QuickAdd onSaved={refresh} vaultId={vaultId} authorId={userId} />

        {view === "grid" ? (
          <IdeaGrid refreshKey={refreshKey} vaultId={vaultId} userId={userId} />
        ) : (
          <KanbanBoard refreshKey={refreshKey} vaultId={vaultId} />
        )}

        {isModalOpen && (
          <AddIdeaModal
            onClose={() => setIsModalOpen(false)}
            onSaved={() => { setIsModalOpen(false); refresh(); }}
            vaultId={vaultId}
            authorId={userId}
          />
        )}

        {isPickerOpen && (
          <RandomPicker
            vaultId={vaultId}
            onClose={() => setIsPickerOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
