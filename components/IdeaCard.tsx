"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, Send, MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { STATUSES } from "@/lib/types";
import type { Idea, Comment, Status } from "@/lib/types";

const STATUS_DOT: Record<Status, string> = {
  New:       "bg-slate-400",
  Exploring: "bg-indigo-400",
  Building:  "bg-indigo-500",
  Shipped:   "bg-white",
  Archived:  "bg-slate-600",
};

function avatarColor(name: string) {
  const palette = ["#6366f1","#8b5cf6","#06b6d4","#ec4899","#f59e0b","#10b981","#ef4444"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export default function IdeaCard({ idea, userId }: { idea: Idea; userId: string }) {
  const [status, setStatus] = useState<Status>(idea.status ?? "New");
  const [saving, setSaving] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [userSwipe, setUserSwipe] = useState<"left" | "right" | null>(null);
  const [swipeBounce, setSwipeBounce] = useState<"left" | "right" | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    async function fetchMeta() {
      const [{ data: myRating }, { data: allRatings }, { data: mySwipe }, { count }] = await Promise.all([
        supabase.from("ratings").select("score").eq("idea_id", idea.id).eq("user_id", userId).maybeSingle(),
        supabase.from("ratings").select("score").eq("idea_id", idea.id),
        supabase.from("swipes").select("direction").eq("idea_id", idea.id).eq("user_id", userId).maybeSingle(),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("idea_id", idea.id),
      ]);
      if (myRating) setUserRating(myRating.score);
      if (allRatings?.length) setAvgRating(Math.round((allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length) * 10) / 10);
      if (mySwipe) setUserSwipe(mySwipe.direction as "left" | "right");
      setCommentCount(count ?? 0);
    }
    fetchMeta();
  }, [idea.id, userId]);

  async function handleRating(score: number) {
    setUserRating(score);
    await supabase.from("ratings").upsert({ idea_id: idea.id, user_id: userId, score });
    const { data } = await supabase.from("ratings").select("score").eq("idea_id", idea.id);
    if (data?.length) setAvgRating(Math.round((data.reduce((s, r) => s + r.score, 0) / data.length) * 10) / 10);
  }

  async function handleSwipe(direction: "left" | "right") {
    const next = userSwipe === direction ? null : direction;
    setUserSwipe(next);
    setSwipeBounce(direction);
    setTimeout(() => setSwipeBounce(null), 300);
    if (next === null) await supabase.from("swipes").delete().eq("idea_id", idea.id).eq("user_id", userId);
    else await supabase.from("swipes").upsert({ idea_id: idea.id, user_id: userId, direction: next });
  }

  async function handleStatusChange(next: Status) {
    setSaving(true);
    setStatus(next);
    setShowStatusMenu(false);
    await supabase.from("ideas").update({ status: next }).eq("id", idea.id);
    setSaving(false);
    toast.success(`Moved to ${next}`);
  }

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(name)")
      .eq("idea_id", idea.id)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) ?? []);
  }

  async function toggleComments() {
    if (!showComments) await loadComments();
    setShowComments((v) => !v);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setAddingComment(true);
    const { error } = await supabase.from("comments").insert({ idea_id: idea.id, author_id: userId, content: commentText.trim() });
    if (!error) { setCommentText(""); setCommentCount((c) => c + 1); await loadComments(); toast.success("Comment posted"); }
    setAddingComment(false);
  }

  const displayRating = hoverRating ?? userRating ?? 0;
  const authorName = idea.author?.name;
  const isArchived = status === "Archived";

  return (
    <motion.div
      layout
      className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-default
        ${isArchived ? "opacity-35 grayscale" : ""}
      `}
      style={{
        background: "#0D1117",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
      whileHover={{
        borderColor: "rgba(99,102,241,0.2)",
        boxShadow: "0 0 40px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.4)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          {/* Domain — plain, no color */}
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.07)" }}>
            {idea.domain}
          </span>
          <span className="text-[11px]" style={{ color: "#334155" }}>
            {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed flex-1" style={{ color: "#e2e8f0" }}>{idea.content}</p>

        {idea.summary && (
          <p className="text-xs italic leading-relaxed pl-3"
            style={{ color: "#475569", borderLeft: "2px solid rgba(255,255,255,0.08)" }}>
            {idea.summary}
          </p>
        )}

        {/* Rating + Swipe */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => handleRating(star)}
                onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(null)}
                className="transition-transform hover:scale-125 focus:outline-none">
                <Star size={13} className={`transition-colors ${displayRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-800"}`} />
              </button>
            ))}
            {avgRating !== null && <span className="text-[11px] text-slate-600 ml-1.5">{avgRating}</span>}
          </div>

          {/* Swipes */}
          <div className="flex items-center gap-1">
            {([["left", ThumbsDown, "rgba(239,68,68,0.12)", "#f87171"], ["right", ThumbsUp, "rgba(99,102,241,0.12)", "#818cf8"]] as const).map(([dir, Icon, activeBg, activeColor]) => (
              <motion.button key={dir}
                animate={swipeBounce === dir ? { scale: [1, 1.35, 1] } : {}}
                transition={{ duration: 0.25 }}
                onClick={() => handleSwipe(dir)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: userSwipe === dir ? activeBg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${userSwipe === dir ? activeColor + "40" : "rgba(255,255,255,0.06)"}`,
                  color: userSwipe === dir ? activeColor : "#334155",
                }}>
                <Icon size={12} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Status picker */}
          <div className="relative">
            <button onClick={() => setShowStatusMenu((v) => !v)} disabled={saving}
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
              {status}
              <ChevronDown size={10} className={`transition-transform ${showStatusMenu ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showStatusMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-1 left-0 z-20 min-w-[130px] rounded-xl overflow-hidden shadow-2xl"
                  style={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.09)" }}>
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(s)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors hover:bg-white/[0.04]"
                      style={{ color: s === status ? "#a5b4fc" : "#64748b" }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {authorName && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: avatarColor(authorName) }}>
                <span className="text-[8px] font-bold text-white">{authorName[0].toUpperCase()}</span>
              </div>
            )}
            <button onClick={toggleComments}
              className={`flex items-center gap-1 text-[11px] transition-colors ${showComments ? "text-indigo-400" : "text-slate-700 hover:text-slate-400"}`}>
              <MessageCircle size={12} /> {commentCount}
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="p-4 flex flex-col gap-3">
              {comments.length === 0
                ? <p className="text-[11px] text-center py-2" style={{ color: "#1e293b" }}>No comments yet. Be first.</p>
                : <div className="flex flex-col gap-3 max-h-44 overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        {c.author?.name && (
                          <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                            style={{ background: avatarColor(c.author.name) }}>
                            <span className="text-[8px] font-bold text-white">{c.author.name[0].toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[11px] font-medium" style={{ color: "#cbd5e1" }}>{c.author?.name ?? "Anonymous"}</span>
                            <span className="text-[10px]" style={{ color: "#1e293b" }}>
                              {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-[12px] leading-relaxed break-words" style={{ color: "#64748b" }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
              <form onSubmit={submitComment} className="flex gap-2">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#e2e8f0" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.07)")} />
                <button type="submit" disabled={addingComment || !commentText.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  <Send size={11} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
