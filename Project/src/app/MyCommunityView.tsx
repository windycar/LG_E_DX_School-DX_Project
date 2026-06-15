import { apiUrl } from "./api";
import React, { useState, useEffect } from "react";
import { X, MessageCircle, Pencil, Trash2, Send } from "lucide-react";

interface MyCommunityViewProps {
  userId: number;
  initialTab: "posts" | "comments";
  onClose: () => void;
}

// 🚀 시간 & 주차 계산 함수 (CommunityView와 완전 동일)
const timeAgo = (dateString: string) => {
  if (!dateString) return "방금 전";
  const start = new Date(dateString);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - start.getTime()) / 60000);
  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}시간 전`;
  return `${Math.floor(diffHrs / 24)}일 전`;
};

const calculateWeek = (dateString: string | undefined | null) => {
  if (!dateString || dateString === "None" || dateString === "") return 0;
  const start = new Date(dateString);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / 7));
};

const normalizePregnancyPeriod = (period: string | undefined | null) => {
  const value = String(period || "").trim().replace(/^임신\s*/, "");
  if (value === "초기" || value === "중기" || value === "후기") {
    return `임신 ${value}`;
  }
  return "임신 시기 미지정";
};

export default function MyCommunityView({ userId, initialTab, onClose }: MyCommunityViewProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "comments">(initialTab);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 커뮤니티 화면의 댓글 무적 로직 그대로 가져옴!
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  const fetchData = () => {
    setIsLoading(true);
    const endpoint = activeTab === "posts" ? "my-posts" : "my-comments";
    fetch(apiUrl(`/api/community/${endpoint}/${userId}`))
      .then(res => res.json())
      .then(resData => {
        // 백엔드가 내가 댓글 단 '게시글(posts)'을 보내주므로 그냥 쓰면 됩니다.
        if (resData.status === "Success") setData(activeTab === "posts" ? resData.posts : resData.comments);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(); }, [activeTab, userId]);

  // 🚀 게시글 삭제 로직
  const deletePost = async (postId: number) => {
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
    const res = await fetch(apiUrl(`/api/community/posts/${postId}?user_id=${userId}`), { method: "DELETE" });
    if (res.ok) fetchData();
    else {
      const error = await res.json().catch(() => ({}));
      alert(error.detail || "게시글 삭제에 실패했습니다.");
    }
  };

  const updatePost = async (postId: number) => {
    if (!editPostTitle.trim() || !editPostContent.trim()) return;
    const res = await fetch(apiUrl(`/api/community/posts/${postId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, title: editPostTitle, content: editPostContent }),
    });
    if (res.ok) {
      setEditingPostId(null);
      fetchData();
    } else {
      const error = await res.json().catch(() => ({}));
      alert(error.detail || "게시글 수정에 실패했습니다.");
    }
  };

  // 🚀 댓글 전개 및 조회 로직
  const toggleComments = async (postId: number) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    setPostComments([]); 
    await fetchComments(postId);
  };

  const fetchComments = async (postId: number) => {
    try {
      const res = await fetch(apiUrl(`/api/posts/${postId}/comments`));
      const data = await res.json();
      if (data.status === "Success" && Array.isArray(data.comments)) setPostComments(data.comments);
      else setPostComments([]);
    } catch (e) { setPostComments([]); }
  };

  // 🚀 댓글 작성 및 삭제 로직
  const submitComment = async (postId: number) => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(apiUrl(`/api/posts/${postId}/comments`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content: newComment }),
      });
      if (res.ok) {
        setNewComment(""); fetchComments(postId); fetchData();
      } else alert("댓글 등록 실패");
    } catch (e) { alert("서버 오류"); }
  };

  const deletePostComment = async (commentId: number, postId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(apiUrl(`/api/comments/${commentId}?user_id=${userId}`), { method: "DELETE" });
      if (res.ok) { fetchComments(postId); fetchData(); } 
      else alert("삭제 실패");
    } catch (e) { alert("서버 오류"); }
  };

  const updatePostComment = async (commentId: number, postId: number) => {
    if (!editCommentContent.trim()) return;
    const res = await fetch(apiUrl(`/api/comments/${commentId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, content: editCommentContent }),
    });
    if (res.ok) {
      setEditingCommentId(null);
      fetchComments(postId);
      fetchData();
    } else {
      const error = await res.json().catch(() => ({}));
      alert(error.detail || "댓글 수정에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[150] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-5 py-4 bg-card/90 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
        <h1 className="font-semibold text-foreground">나의 활동 내역</h1>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors"><X size={20} className="text-foreground" /></button>
      </div>

      <div className="flex px-5 mt-5 gap-4">
        <button onClick={() => setActiveTab("posts")} className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all shadow-sm ${activeTab === "posts" ? "text-white" : "bg-secondary text-muted-foreground"}`} style={{ background: activeTab === "posts" ? "#78C9A0" : "#FCF0F4" }}>내가 쓴 글</button>
        <button onClick={() => setActiveTab("comments")} className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all shadow-sm ${activeTab === "comments" ? "text-white" : "bg-secondary text-muted-foreground"}`} style={{ background: activeTab === "comments" ? "#78C9A0" : "#FCF0F4" }}>내가 쓴 댓글</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-10">
        {isLoading ? (
          <p className="text-center py-20 text-muted-foreground text-sm">불러오는 중...</p>
        ) : data.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground"><p className="text-4xl mb-4">💬</p><p className="text-sm font-medium">아직 활동 내역이 없습니다.</p></div>
        ) : (
          data.map((item) => {
            const postId = item.post_id;
            const isExpanded = expandedPostId === postId;

            // 🚀 이제 "내가 쓴 글"이든 "내가 쓴 댓글"이든 똑같은 메인 커뮤니티 카드가 나옵니다!
            return (
              <div key={postId} className="bg-white rounded-2xl p-5 border border-border shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-[#FCF0F4]">👤</div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: item.role === "pregnant" || item.role === "PREGNANT" ? "rgba(201,78,112,0.1)" : "rgba(123,104,181,0.1)", color: item.role === "pregnant" || item.role === "PREGNANT" ? "#C94E70" : "#7B68B5" }}>
                          {item.role === "pregnant" || item.role === "PREGNANT" ? "임산부" : "보호자"}
                        </span>
                        <p className="text-sm font-bold text-foreground">{item.author || "익명"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(120,201,160,0.1)", color: "#78C9A0" }}>
                          {normalizePregnancyPeriod(item.pregnancy_period)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {/* 🚀 게시글 삭제 버튼 (게시글의 작성자 == 로그인한 유저일 때만 뜸) */}
                  {userId === item.user_id && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingPostId(postId); setEditPostTitle(item.title || ""); setEditPostContent(item.content || ""); }} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-[#69B98D] hover:bg-green-50"><Pencil size={14} /> 수정</button>
                      <button onClick={() => deletePost(postId)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14} /> 삭제</button>
                    </div>
                  )}
                </div>
                
                {editingPostId === postId ? (
                  <div className="space-y-2 mb-4">
                    <input value={editPostTitle} onChange={(e) => setEditPostTitle(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-[#78C9A0]" />
                    <textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} rows={4} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:border-[#78C9A0] resize-none" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 text-xs rounded-lg border border-border">취소</button>
                      <button onClick={() => updatePost(postId)} className="px-3 py-1.5 text-xs rounded-lg text-white bg-[#78C9A0]">저장</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.title && <p className="text-[15px] font-bold text-[#333] mb-1">{item.title}</p>}
                    <p className="text-[14px] text-[#555] leading-relaxed mb-4">{item.content}</p>
                  </>
                )}

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <button 
                    onClick={() => toggleComments(postId)} 
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: isExpanded ? "#C94E70" : "#888" }}
                  >
                    <MessageCircle size={16} /> 
                    {isExpanded ? "댓글 닫기" : `댓글 ${item.comment_count || 0}개 보기`}
                  </button>
                  {!isExpanded && (item.comment_count || 0) > 0 && (
                    <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-bold text-muted-foreground">{item.comment_count}</span>
                  )}
                </div>

                {/* 🚀 댓글 창 영역 */}
                {isExpanded && (
                  <div className="mt-3 bg-[#FDFDFD] rounded-xl border border-border overflow-hidden">
                    <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto bg-[#FCF0F4]/10">
                      {(!postComments || postComments.length === 0) ? (
                        <p className="text-center text-xs text-muted-foreground py-2">첫 번째 댓글을 남겨보세요!</p>
                      ) : (
                        postComments.map((c) => {
                          const isCmtPregnant = c.author_role === "pregnant" || c.author_role === "PREGNANT";
                          const cmtWeek = isCmtPregnant && c.pregnancy_start_date && c.pregnancy_start_date !== "None" ? calculateWeek(c.pregnancy_start_date) : null;
                          return (
                            <div key={c.id} className="flex justify-between items-start gap-3 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: isCmtPregnant ? "rgba(201,78,112,0.1)" : "rgba(123,104,181,0.1)", color: isCmtPregnant ? "#C94E70" : "#7B68B5" }}>
                                    {isCmtPregnant ? `임산부 • ${cmtWeek !== null ? cmtWeek : "?"}주차` : "보호자"}
                                  </span>
                                  <span className="text-xs font-bold text-foreground">{c.author_name}</span>
                                  <span className="text-[10px] text-muted-foreground ml-1">{timeAgo(c.created_at)}</span>
                                </div>
                                {editingCommentId === c.id ? (
                                  <div className="flex gap-1 mt-1">
                                    <input value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updatePostComment(c.id, postId)} className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none focus:border-[#78C9A0]" />
                                    <button onClick={() => updatePostComment(c.id, postId)} className="px-2 text-xs rounded bg-[#78C9A0] text-white">저장</button>
                                  </div>
                                ) : (
                                  <p className="text-[13px] text-[#444] leading-snug">{c.content}</p>
                                )}
                              </div>
                              {/* 🚀 댓글 삭제 버튼 (댓글의 작성자 == 로그인한 유저일 때만 뜸) */}
                              {userId === c.user_id && (
                                <div className="flex">
                                  <button onClick={() => { setEditingCommentId(c.id); setEditCommentContent(c.content); }} className="p-1.5 text-muted-foreground hover:text-[#69B98D] hover:bg-green-50 rounded-lg"><Pencil size={14} /></button>
                                  <button onClick={() => deletePostComment(c.id, postId)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-2.5 bg-white border-t border-border flex gap-2 items-center">
                      <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitComment(postId)} placeholder="따뜻한 댓글을 남겨주세요..." className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-border bg-[#FCF0F4]/30 focus:outline-none focus:border-[#78C9A0]" />
                      <button onClick={() => submitComment(postId)} className="p-2.5 rounded-lg text-white transition-colors" style={{ background: newComment.trim() ? "#78C9A0" : "#D1D5DB" }} disabled={!newComment.trim()}><Send size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
