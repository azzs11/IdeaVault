"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, Shuffle, LogOut, LayoutGrid, Columns } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import QuickAdd from "@/components/QuickAdd";
import AddIdeaModal from "@/components/AddIdeaModal";
import IdeaGrid from "@/components/IdeaGrid";
import KanbanBoard from "@/components/KanbanBoard";
import RandomPicker from "@/components/RandomPicker";

interface Vault { name: string; code: string; }
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
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function refresh() { setRefreshKey((k) => k + 1); }

  if (!vault || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Sticky minimal nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.05]"
        style={{ background: "rgba(7,11,18,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <span className="text-[10px] font-bold text-white">IV</span>
            </div>
            <span className="text-sm font-semibold text-slate-200">{vault.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-slate-600">{userName}</span>

            {/* View toggle */}
            <div className="flex border border-white/[0.08] rounded-lg p-0.5 gap-0.5"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              {([["grid", LayoutGrid], ["kanban", Columns]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === v
                      ? "bg-white/[0.08] text-slate-200"
                      : "text-slate-600 hover:text-slate-400"
                  }`}>
                  <Icon size={12} />
                  <span className="hidden sm:inline capitalize">{v === "kanban" ? "Board" : "Grid"}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setIsPickerOpen(true)} title="Surprise me"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <Shuffle size={13} />
            </button>

            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}>
              + New
            </button>

            <button onClick={handleLogout} title="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.08] text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="pt-14 pb-10 text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight text-gradient mb-3">
            {vault.name}
          </h1>
          <p className="text-slate-600 text-sm mb-4">
            Every great idea starts here.
          </p>
          <button onClick={copyCode}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] text-xs text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="font-mono tracking-widest">{vault.code}</span>
            <motion.span key={copied ? "c" : "u"} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {copied ? <Check size={11} className="text-indigo-400" /> : <Copy size={11} />}
            </motion.span>
          </button>
        </motion.div>

        {/* QuickAdd */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}>
          <QuickAdd onSaved={refresh} vaultId={vaultId} authorId={userId} />
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}>
          {view === "grid"
            ? <IdeaGrid refreshKey={refreshKey} vaultId={vaultId} userId={userId} />
            : <KanbanBoard refreshKey={refreshKey} vaultId={vaultId} />}
        </motion.div>
      </div>

      {isModalOpen && (
        <AddIdeaModal onClose={() => setIsModalOpen(false)}
          onSaved={() => { setIsModalOpen(false); refresh(); }}
          vaultId={vaultId} authorId={userId} />
      )}
      {isPickerOpen && (
        <RandomPicker vaultId={vaultId} onClose={() => setIsPickerOpen(false)} />
      )}
    </main>
  );
}
