import { apiUrl } from "./api";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageCircle, Pencil, Plus, Trash2, Send, X } from "lucide-react";
import { AppUser, Screen } from "./types";
// @ts-ignore
import { BottomNav } from "./App";

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

export default function CommunityView({ user, onBack, onNavigate }: { user: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const isPregnant = String(user.role).toUpperCase() === "PREGNANT";
  const userId = (user as any).id || user.user_id; 
  
  const identifier = userId || user.email;

  const [dbInfo, setDbInfo] = useState({
    pregnancy_start_date: "",
  });

  useEffect(() => {
    if (!identifier) return;
    fetch(apiUrl(`/api/user/info/${identifier}`))
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success") {
          if (data.user_id) {
            (user as any).user_id = data.user_id;
            (user as any).id = data.user_id;
          }
          setDbInfo({
            pregnancy_start_date: data.pregnancy_start_date || "",
          });
        }
      })
      .catch(e => console.error("커뮤니티 유저 정보 갱신 실패:", e));
  }, [identifier]);

  const currentWeek = calculateWeek(dbInfo.pregnancy_start_date);
  
  const getPeriod = (week: number) => {
    if (week <= 13) return "초기";
    if (week <= 27) return "중기";
    return "후기";
  };
  const currentPeriod = getPeriod(currentWeek);
  
  const [selPeriod, setSelPeriod] = useState<string>("전체");
  
  const [posts, setPosts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  useEffect(() => { fetchPosts(); }, [userId]);

  const fetchPosts = async () => {
    try {
      const query = userId ? `?user_id=${encodeURIComponent(String(userId))}` : "";
      const res = await fetch(apiUrl(`/api/community/posts${query}`));
      const data = await res.json();
      if (data.status === "Success" && Array.isArray(data.posts)) setPosts(data.posts);
      else setPosts([]);
    } catch (e) {
      console.error("게시글 불러오기 실패:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: number) => {
    if (!userId) {
      alert("로그인 사용자 정보를 확인할 수 없습니다.");
      return;
    }
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(apiUrl(`/api/community/posts/${postId}?user_id=${userId}`), { method: "DELETE" });
      if (res.ok) fetchPosts();
      else {
        const error = await res.json().catch(() => ({}));
        alert(error.detail || "게시글 삭제에 실패했습니다.");
      }
    } catch (e) { alert("서버와 통신 오류가 발생했습니다."); }
  };

  const startEditPost = (post: any) => {
    setEditingPostId(post.id || post.post_id);
    setEditPostTitle(post.title || "");
    setEditPostContent(post.content || "");
  };

  const updatePost = async (postId: number) => {
    if (!editPostTitle.trim() || !editPostContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    const res = await fetch(apiUrl(`/api/community/posts/${postId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, title: editPostTitle, content: editPostContent }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error.detail || "게시글 수정에 실패했습니다.");
      return;
    }
    setEditingPostId(null);
    fetchPosts();
  };

  const toggleLike = async (postId: number) => {
    const currentUserId = (user as any).id || (user as any).user_id;
    if (!currentUserId) {
      alert("로그인 사용자 정보를 확인할 수 없습니다.");
      return;
    }

    setPosts((prev) =>
      prev.map((post) => {
        const targetId = post.id || post.post_id;
        if (targetId !== postId) return post;
        const wasLiked = Boolean(post.liked_by_me);
        return {
          ...post,
          liked_by_me: !wasLiked,
          like_count: Math.max(0, Number(post.like_count || 0) + (wasLiked ? -1 : 1)),
        };
      })
    );

    try {
      const res = await fetch(apiUrl(`/api/community/posts/${postId}/like?user_id=${currentUserId}`), { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.status !== "Success") throw new Error(data.detail || data.message || "좋아요 처리 실패");
      setPosts((prev) =>
        prev.map((post) => {
          const targetId = post.id || post.post_id;
          return targetId === postId ? { ...post, liked_by_me: data.liked, like_count: data.like_count } : post;
        })
      );
    } catch (e) {
      alert("좋아요 처리 중 오류가 발생했습니다.");
      fetchPosts();
    }
  };

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
    } catch (e) { 
      console.error("댓글 불러오기 실패", e);
      setPostComments([]);
    }
  };

  const submitComment = async (postId: number) => {
    if (!newComment.trim()) return;
    const currentUserId = (user as any).id || (user as any).user_id;
    if (!currentUserId) {
      alert("로그인 사용자 정보를 확인할 수 없습니다.");
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/posts/${postId}/comments`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, content: newComment }),
      });
      if (res.ok) {
        setNewComment(""); 
        fetchComments(postId); 
        fetchPosts(); // 댓글 개수 갱신
      } else alert("댓글 등록 실패");
    } catch (e) { alert("서버 오류"); }
  };

  const deleteComment = async (commentId: number, postId: number) => {
    const currentUserId = (user as any).id || (user as any).user_id;
    if (!currentUserId) {
      alert("로그인 사용자 정보를 확인할 수 없습니다.");
      return;
    }
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(apiUrl(`/api/comments/${commentId}?user_id=${currentUserId}`), { method: "DELETE" });
      if (res.ok) {
        fetchComments(postId);
        fetchPosts(); // 댓글 개수 갱신
      } else {
        const err = await res.json();
        alert(err.detail || "삭제 실패");
      }
    } catch (e) { alert("서버 오류"); }
  };

  const updateComment = async (commentId: number, postId: number) => {
    if (!editCommentContent.trim()) return;
    const currentUserId = (user as any).id || (user as any).user_id;
    const res = await fetch(apiUrl(`/api/comments/${commentId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUserId, content: editCommentContent }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error.detail || "댓글 수정에 실패했습니다.");
      return;
    }
    setEditingCommentId(null);
    fetchComments(postId);
  };

  const PERIODS = [
    { id: "전체", label: "전체 보기", desc: "" },
    { id: "초기", label: "임신 초기", desc: "1-13주" },
    { id: "중기", label: "임신 중기", desc: "14-27주" },
    { id: "후기", label: "임신 후기", desc: "28-40주" },
  ];

  const safePosts = Array.isArray(posts) ? posts : [];
  const filtered = selPeriod === "전체" ? safePosts : safePosts.filter((p) => p && (p.period === selPeriod || p.pregnancy_period === selPeriod));

  const addPost = async () => {
    if (!newTitle.trim() || !newPost.trim()) {
      alert("제목과 내용을 모두 입력해주세요!");
      return;
    }
    
    const currentUserId = (user as any).id || (user as any).user_id;
    if (!currentUserId) {
      alert("로그인 사용자 정보를 확인할 수 없습니다.");
      return;
    }
    
    const payload = {
      user_id: currentUserId, 
      pregnancy_period: currentPeriod, 
      title: newTitle,
      content: newPost,
    };
    
    try {
      const res = await fetch(apiUrl("/api/community/posts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        alert(error.detail || "글 작성에 실패했습니다.");
        return;
      }
      
      fetchPosts();
      setShowForm(false);
      setNewTitle("");
      setNewPost("");
      setSelPeriod(currentPeriod); 
    } catch (e) { alert("서버 연결 실패"); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 bg-card/90 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground">커뮤니티</h1>
      </div>

      <div className="px-5 py-5 space-y-5 flex-1 overflow-y-auto pb-20">
        <div className="rounded-2xl p-4 flex items-center gap-3 text-sm shadow-sm" style={{ background: "#FDFDFD", border: "1px solid rgba(120,201,160,0.15)" }}>
          <span className="text-lg">👥</span>
          <p className="text-muted-foreground">현재 <span className="font-bold" style={{ color: "#69C99A" }}>임신 {currentPeriod}</span> ({currentWeek}주차)입니다</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-3">시기별 보기</p>
          <div className="grid grid-cols-2 gap-2">
            {PERIODS.map((period) => {
              const isSelected = selPeriod === period.id;
              return (
                <button
                  key={period.id}
                  onClick={() => setSelPeriod(period.id)}
                  className="py-3 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm"
                  style={{ background: isSelected ? "#78C9A0" : "#FCF0F4", color: isSelected ? "white" : "#A68A94", border: isSelected ? "none" : "1px solid rgba(201,78,112,0.05)" }}
                >
                  <span className="font-bold text-[15px]">{period.label}</span>
                  {period.desc && <span className="text-[11px] mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#BFA6AE" }}>{period.desc}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="w-full py-4 rounded-2xl border-[1.5px] border-dashed font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#78C9A0]/5" style={{ borderColor: "#78C9A0", color: "#78C9A0" }}>
          <Plus size={18} strokeWidth={2.5} /> 내 임신 시기({currentPeriod}) 이야기 나누기
        </button>

        {showForm && (
          <div className="bg-white rounded-2xl p-4 border border-border space-y-3 shadow-sm">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="글 제목을 입력하세요" className="w-full text-sm px-4 py-3 rounded-xl border border-border bg-[#FCF0F4]/30 focus:outline-none focus:border-[#78C9A0]" />
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="비슷한 시기의 분들과 경험을 나눠보세요 💙" rows={4} className="w-full text-sm px-4 py-3 rounded-xl border border-border bg-[#FCF0F4]/30 focus:outline-none focus:border-[#78C9A0] resize-none" />
            <div className="flex gap-2">
              <button onClick={addPost} className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: "#78C9A0" }}>게시하기</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border border-border text-muted-foreground bg-white">취소</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-10 text-muted-foreground text-sm">게시글을 불러오는 중입니다...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-4">💬</p>
              <p className="text-sm font-medium">아직 게시물이 없어요</p>
            </div>
          ) : (
            filtered.map((post) => {
              const postId = post.id || post.post_id;
              const isExpanded = expandedPostId === postId;
              const currentUserId = (user as any).id || (user as any).user_id;

              return (
                <div key={postId} className="bg-white rounded-2xl p-5 border border-border shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-[#FCF0F4]">👤</div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: post.role === "pregnant" || post.role === "PREGNANT" ? "rgba(201,78,112,0.1)" : "rgba(123,104,181,0.1)", color: post.role === "pregnant" || post.role === "PREGNANT" ? "#C94E70" : "#7B68B5" }}>
                            {post.role === "pregnant" || post.role === "PREGNANT" ? "임산부" : "보호자"}
                          </span>
                          <p className="text-sm font-bold text-foreground">{post.author || "익명"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(120,201,160,0.1)", color: "#78C9A0" }}>임신 {post.period || post.pregnancy_period}</span>
                          <span className="text-[11px] text-muted-foreground">{post.created_at ? timeAgo(post.created_at) : (post.time || "방금 전")}</span>
                        </div>
                      </div>
                    </div>
                    {currentUserId === post.user_id && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditPost(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-[#69B98D] hover:bg-green-50 transition-colors">
                          <Pencil size={14} /> 수정
                        </button>
                        <button onClick={() => deletePost(postId)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 size={14} /> 삭제
                        </button>
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
                      {post.title && <p className="text-[15px] font-bold text-[#333] mb-1">{post.title}</p>}
                      <p className="text-[14px] text-[#555] leading-relaxed mb-4">{post.content}</p>
                    </>
                  )}

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleLike(postId)}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        style={{ color: post.liked_by_me ? "#C94E70" : "#888" }}
                      >
                        <Heart size={16} fill={post.liked_by_me ? "#C94E70" : "none"} />
                        좋아요 {post.like_count || 0}
                      </button>
                      <button
                        onClick={() => toggleComments(postId)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: isExpanded ? "#C94E70" : "#888" }}
                      >
                        <MessageCircle size={16} />
                        {isExpanded ? "댓글 닫기" : `댓글 ${post.comment_count || 0}개 보기`}
                      </button>
                    </div>

                    {!isExpanded && (post.comment_count || 0) > 0 && (
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-bold text-muted-foreground">
                        {post.comment_count}
                      </span>
                    )}
                  </div>

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
                                      <input value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updateComment(c.id, postId)} className="flex-1 text-xs px-2 py-1.5 rounded border border-border focus:outline-none focus:border-[#78C9A0]" />
                                      <button onClick={() => updateComment(c.id, postId)} className="px-2 text-xs rounded bg-[#78C9A0] text-white">저장</button>
                                      <button onClick={() => setEditingCommentId(null)} className="p-1 text-muted-foreground"><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <p className="text-[13px] text-[#444] leading-snug">{c.content}</p>
                                  )}
                                </div>
                                
                                {currentUserId === c.user_id && (
                                  <div className="flex">
                                    <button onClick={() => { setEditingCommentId(c.id); setEditCommentContent(c.content); }} className="p-1.5 text-muted-foreground hover:text-[#69B98D] hover:bg-green-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                                    <button onClick={() => deleteComment(c.id, postId)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="p-2.5 bg-white border-t border-border flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={newComment} 
                          onChange={(e) => setNewComment(e.target.value)} 
                          onKeyDown={(e) => e.key === "Enter" && submitComment(postId)}
                          placeholder="따뜻한 댓글을 남겨주세요..." 
                          className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-border bg-[#FCF0F4]/30 focus:outline-none focus:border-[#78C9A0]" 
                        />
                        <button 
                          onClick={() => submitComment(postId)} 
                          className="p-2.5 rounded-lg text-white transition-colors" 
                          style={{ background: newComment.trim() ? "#78C9A0" : "#D1D5DB" }}
                          disabled={!newComment.trim()}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}
