"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }
      if (!data.session || !data.user) {
        setError("Check your email to confirm your account, then sign in.");
        setLoading(false);
        return;
      }
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        name: name.trim() || "Anonymous",
      });
      if (profileError && profileError.code !== "23505") {
        setError("Account created but profile setup failed: " + profileError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message || "Sign in failed. Please try again.");
        setLoading(false);
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent)", boxShadow: "0 8px 28px rgba(245,165,36,0.28)" }}
          >
            <span className="text-xl font-bold" style={{ color: "var(--on-accent)" }}>IV</span>
          </motion.div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ink)" }}>IdeaVault</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>One shared place for every half-formed idea.</p>
        </div>

        {/* Card */}
        <div className="panel rounded-2xl p-6 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 mb-6 relative">
            <motion.div
              className="absolute inset-y-1 rounded-lg bg-white/[0.08]"
              initial={false}
              animate={{ left: mode === "signin" ? "4px" : "50%", right: mode === "signin" ? "50%" : "4px" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className="relative z-10 flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: mode === m ? "var(--ink)" : "var(--text-2)" }}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="input-field px-4 py-3 text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="input-field px-4 py-3 text-sm"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="input-field px-4 py-3 pr-11 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--text-3)" }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent py-3 text-sm mt-1"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> {mode === "signin" ? "Signing in…" : "Creating account…"}</>
              ) : (
                mode === "signin" ? "Sign in" : "Create account"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
