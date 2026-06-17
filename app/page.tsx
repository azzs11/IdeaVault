import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data, error } = await supabase.from("ideas").select("count");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">IdeaVault</h1>
        {error ? (
          <p className="text-red-400 text-sm">Supabase error: {error.message}</p>
        ) : (
          <p className="text-green-400 text-sm">
            Supabase connected ✓ ({data?.[0]?.count ?? 0} ideas)
          </p>
        )}
      </div>
    </main>
  );
}
