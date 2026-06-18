"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/guest"); return; }

      const { data: membership } = await supabase
        .from("vault_members")
        .select("vault_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) {
        router.push("/vault/setup");
      } else {
        router.push(`/vault/${membership.vault_id}`);
      }
    }

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid var(--accent)", borderTopColor: "transparent" }} />
    </div>
  );
}
