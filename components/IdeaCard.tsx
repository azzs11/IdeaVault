"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { STATUSES } from "@/lib/types";
import type { Idea, Comment, Domain, Status } from "@/lib/types";

const DOMAIN_COLORS: Record<Domain, string> = {
  Tech: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Product: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Business: "bg-green-500/20 text-green-300 border-green-500/30",
  Design: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Personal: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Research: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const STATUS_COLORS: Record<Status, string> = {
  New: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Exploring: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Building: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Shipped: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Archived: "bg-gray-500/20 text-gray-400 border-gray-600/30",
};

export default function IdeaCard({ idea, userId }: { idea: Idea; userId: string }) {
  const [status, setStatus] = useState<Status>(idea.status ?? "New");
  const [saving, setSaving] = useState(false);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [userSwipe, setUserSwipe] = useState<"left" | "right" | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    async function fetchMeta() {
      const [
        { data: myRating },
        { data: allRatings },
        { data: mySwipe },
        { count },
      ] = await Promise.all([
        supabase.from("ratings").select("score").eq("idea_id", idea.id).eq("user_id", userId).maybeSingle(),
        supabase.from("ratings").select("score").eq("idea_id", idea.id),
        supabase.from("swipes").select("direction").eq("idea_id", idea.id).eq("user_id", userId).maybeSingle(),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("idea_id", idea.id),
      ]);

      if (myRating) setUserRating(myRating.score);
      if (allRatings && allRatings.length > 0) {
        const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
      if (mySwipe) setUserSwipe(mySwipe.direction as "left" | "right");
      setCommentCount(count ?? 0);
    }

    fetchMeta();
  }, [idea.id, userId]);

  async function handleRating(score: number) {
    setUserRating(score);
    await supabase.from("ratings").upsert({ idea_id: idea.id, user_id: userId, score });
    const { data } = await supabase.from("ratings").select("score").eq("idea_id", idea.id);
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length;
      setAvgRating(Math.round(avg * 10) / 10);
    }
  }

  async function handleSwipe(direction: "left" | "right") {
    const next = userSwipe === direction ? null : direction;
    setUserSwipe(next);
    if (next === null) {
      await supabase.from("swipes").delete().eq("idea_id", idea.id).eq("user_id", userId);
    } else {
      await supabase.from("swipes").upsert({ idea_id: idea.id, user_id: userId, direction: next });
    }
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
    const { error } = await supabase.from("comments").insert({
      idea_id: idea.id,
      author_id: userId,
      content: commentText.trim(),
    });
    if (!error) {
      setCommentText("");
      setCommentCount((c) => c + 1);
      await loadComments();
    }
    setAddingComment(false);
  }

  async function handleStatusChange(next: Status) {
    setSaving(true);
    setStatus(next);
    await supabase.from("ideas").update({ status: next }).eq("id", idea.id);
    setSaving(false);
  }

  const displayRating = hoverRating ?? userRating ?? 0;

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl flex flex-col hover:border-gray-600 transition-colors ${status === "Archived" ? "opacity-50" : ""}`}>
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${DOMAIN_COLORS[idea.domain] ?? DOMAIN_COLORS.Other}`}>
            {idea.domain}
          </span>
          <span className="text-xs text-gray-500 shrink-0">
            {new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Content */}
        <p className="text-gray-100 text-sm leading-relaxed">{idea.content}</p>
        {idea.summary && (
          <p className="text-gray-400 text-xs italic">{idea.summary}</p>
        )}

        {/* Rating + Swipe */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-800">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="text-lg leading-none transition-transform hover:scale-125 focus:outline-none"
              >
                <span className={displayRating >= star ? "text-amber-400" : "text-gray-700"}>★</span>
              </button>
            ))}
            {avgRating !== null && (
              <span className="text-xs text-gray-500 ml-1.5">{avgRating}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSwipe("left")}
              title="Dislike"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors border ${
                userSwipe === "left"
                  ? "bg-red-500/20 border-red-500/40"
                  : "bg-gray-800 border-gray-700 hover:border-red-500/40"
              }`}
            >
              👎
            </button>
            <button
              onClick={() => handleSwipe("right")}
              title="Like"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors border ${
                userSwipe === "right"
                  ? "bg-green-500/20 border-green-500/40"
                  : "bg-gray-800 border-gray-700 hover:border-green-500/40"
              }`}
            >
              👍
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-800 pt-2">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            disabled={saving}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors disabled:opacity-60 bg-transparent ${STATUS_COLORS[status]}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-gray-900 text-gray-100">{s}</option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            {idea.author?.name && (
              <span className="text-xs text-gray-500">{idea.author.name}</span>
            )}
            <button
              onClick={toggleComments}
              className={`text-xs flex items-center gap-1 transition-colors ${showComments ? "text-indigo-400" : "text-gray-500 hover:text-indigo-400"}`}
            >
              💬 {commentCount}
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-800 p-4 flex flex-col gap-3">
          {comments.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-1">No comments yet. Be first.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-300">{c.author?.name ?? "Anonymous"}</span>
                    <span className="text-xs text-gray-600">
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={addingComment || !commentText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              {addingComment ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
