"use client";

import { useState } from "react";
import AddIdeaModal from "@/components/AddIdeaModal";
import IdeaGrid from "@/components/IdeaGrid";
import QuickAdd from "@/components/QuickAdd";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IdeaVault</h1>
            <p className="text-gray-400 text-sm mt-1">Your shared idea space</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Detailed
          </button>
        </header>

        <QuickAdd onSaved={refresh} />

        <IdeaGrid refreshKey={refreshKey} />

        {isModalOpen && (
          <AddIdeaModal
            onClose={() => setIsModalOpen(false)}
            onSaved={() => { setIsModalOpen(false); refresh(); }}
          />
        )}
      </div>
    </main>
  );
}
