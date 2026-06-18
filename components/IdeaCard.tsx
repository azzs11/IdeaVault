"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, Send, MessageCircle, ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { guestStore } from "@/lib/guestStore";
import { STATUSES, STATUS_COLOR } from "@/lib/types";
import type { Idea, Comment, Status } from "@/lib/types";

function avatarColor(name: string) {
  const palette = ["#6366f1","#8b5cf6","#06b6d4","#ec4899","#f59e0b","#10b981","#ef4444"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export default function IdeaCard({ idea, userId, guest = false }: { idea: Idea; userId: string; guest?: boolean }) {
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
    if (guest) return; // social meta lives on the server; guests capture solo
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
  }, [idea.id, userId, guest]);

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
    if (guest) {
      guestStore.updateStatus(idea.id, next);
    } else {
      await supabase.from("ideas").update({ status: next }).eq("id", idea.id);
    }
    setSaving(false);
    toast.success(`Moved to ${next}`);
  }

  function handleDelete() {
    guestStore.remove(idea.id);
    toast.success("Idea deleted");
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
      className={`group relative flex flex-col rounded-2xl transition-all duration-300 cursor-default
        ${isArchived ? "opacity-40 grayscale" : ""}
      `}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        zIndex: showStatusMenu ? "var(--z-dropdown)" : undefined,
      }}
      whileHover={{
        borderColor: "var(--accent-line)",
        boxShadow: "0 0 40px rgba(245,165,36,0.07), 0 8px 32px rgba(0,0,0,0.45)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          {/* Domain — neutral; status carries the color */}
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
            {idea.domain}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
            {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--ink)" }}>{idea.content}</p>

        {idea.summary && (
          <p className="text-xs italic leading-relaxed rounded-lg px-3 py-2"
            style={{ color: "var(--text-2)", background: "rgba(255,255,255,0.03)" }}>
            {idea.summary}
          </p>
        )}

        {/* Rating + Swipe — collaboration features, signed-in only */}
        {!guest && (
        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--hairline)" }}>
          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => handleRating(star)}
                onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(null)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                className="transition-transform hover:scale-125 focus:outline-none">
                <Star size={13} className="transition-colors"
                  style={{ color: displayRating >= star ? "var(--accent)" : "rgba(255,255,255,0.18)", fill: displayRating >= star ? "var(--accent)" : "transparent" }} />
              </button>
            ))}
            {avgRating !== null && <span className="text-[11px] ml-1.5" style={{ color: "var(--text-3)" }}>{avgRating}</span>}
          </div>

          {/* Swipes */}
          <div className="flex items-center gap-1">
            {([["left", ThumbsDown, "rgba(248,113,113,0.14)", "#F87171", "Vote down"], ["right", ThumbsUp, "var(--accent-soft)", "var(--accent)", "Vote up"]] as const).map(([dir, Icon, activeBg, activeColor, label]) => (
              <motion.button key={dir}
                animate={swipeBounce === dir ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => handleSwipe(dir)}
                aria-label={label}
                aria-pressed={userSwipe === dir}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: userSwipe === dir ? activeBg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${userSwipe === dir ? activeColor : "var(--hairline)"}`,
                  color: userSwipe === dir ? activeColor : "var(--text-3)",
                }}>
                <Icon size={12} />
              </motion.button>
            ))}
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2"
          style={{ borderTop: "1px solid var(--hairline)" }}>
          {/* Status picker */}
          <div className="relative">
            <button onClick={() => setShowStatusMenu((v) => !v)} disabled={saving}
              aria-haspopup="menu" aria-expanded={showStatusMenu}
              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
              {status}
              <ChevronDown size={10} className={`transition-transform ${showStatusMenu ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showStatusMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  role="menu"
                  className="absolute bottom-full mb-1 left-0 min-w-[130px] rounded-xl overflow-hidden shadow-2xl"
                  style={{ zIndex: "var(--z-dropdown)", background: "var(--surface-2)", border: "1px solid var(--border-strong)" }}>
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(s)} role="menuitem"
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors hover:bg-white/[0.05]"
                      style={{ color: s === status ? "var(--accent)" : "var(--text-2)" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {guest ? (
            <button onClick={handleDelete}
              aria-label="Delete idea"
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:bg-white/[0.06]"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}>
              <Trash2 size={13} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {authorName && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: avatarColor(authorName) }} title={authorName}>
                  <span className="text-[8px] font-bold text-white">{authorName[0].toUpperCase()}</span>
                </div>
              )}
              <button onClick={toggleComments}
                aria-label={`${showComments ? "Hide" : "Show"} comments (${commentCount})`} aria-expanded={showComments}
                className="flex items-center gap-1 text-[11px] transition-colors"
                style={{ color: showComments ? "var(--accent)" : "var(--text-3)" }}>
                <MessageCircle size={12} /> {commentCount}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {!guest && showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            style={{ borderTop: "1px solid var(--hairline)" }}>
            <div className="p-4 flex flex-col gap-3">
              {comments.length === 0
                ? <p className="text-[11px] text-center py-2" style={{ color: "var(--text-3)" }}>No comments yet. Be the first.</p>
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
                            <span className="text-[11px] font-medium" style={{ color: "var(--ink)" }}>{c.author?.name ?? "Anonymous"}</span>
                            <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                              {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-[12px] leading-relaxed break-words" style={{ color: "var(--text-2)" }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
              <form onSubmit={submitComment} className="flex gap-2">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  aria-label="Add a comment"
                  placeholder="Add a comment…"
                  className="input-field flex-1 px-3 py-1.5 text-xs" />
                <button type="submit" disabled={addingComment || !commentText.trim()}
                  aria-label="Post comment"
                  className="btn-accent w-8 h-8 shrink-0 rounded-lg">
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
