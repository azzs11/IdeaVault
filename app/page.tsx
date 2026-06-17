"use client";

import { useState } from "react";
import AddIdeaModal from "@/components/AddIdeaModal";
import IdeaGrid from "@/components/IdeaGrid";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IdeaVault</h1>
            <p className="text-gray-400 text-sm mt-1">Your shared idea space</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Idea
          </button>
        </header>

        <IdeaGrid refreshKey={refreshKey} />

        {isModalOpen && (
          <AddIdeaModal
            onClose={() => setIsModalOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </div>
    </main>
  );
}
