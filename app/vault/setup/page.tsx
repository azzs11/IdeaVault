"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import VaultSetup from "@/components/VaultSetup";

export default function VaultSetupPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id);
    }
    init();
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <VaultSetup userId={userId} />;
}
