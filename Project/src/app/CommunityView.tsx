import React, { useState, useEffect } from "react";
// 🚀 삭제 기능에 쓸 쓰레기통 아이콘(Trash2)을 추가했습니다.
import { ArrowLeft, MessageCircle, ThumbsUp, Plus, Trash2 } from "lucide-react";
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

export default function CommunityView({ user, onBack, onNavigate }: { user: AppUser; onBack: () => void; onNavigate?: (s: Screen) => void }) {
  const connected = (user as any).connected_pregnant;
  
  const getPregnancyWeek = () => {
    if (user.role === "pregnant") {
      return user.pregnancyWeek || 0;
    }
    if (user.role === "guardian" && connected?.pregnancy_start_date) {
      const start = new Date(connected.pregnancy_start_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, Math.floor(diffDays / 7));
    }
    return 0;
  };
  
  const currentWeek = getPregnancyWeek();

  const getPeriod = (week: number) => {
    if (week <= 13) return "초기";
    if (week <= 27) return "중기";
    return "후기";
  };
  
  const currentPeriod = getPeriod(currentWeek);

  const [selPeriod, setSelPeriod] = useState<string>(currentPeriod);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/community/posts");
      const data = await res.json();
      if (data.status === "Success") {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("게시글 불러오기 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 게시글 삭제 함수 추가
  const deletePost = async (postId: number) => {
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/community/posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // 성공적으로 삭제되었으면 목록 새로고침
        fetchPosts();
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } catch (e) {
      alert("서버와 통신 오류가 발생했습니다.");
    }
  };

  const PERIODS = [
    { id: "전체", label: "전체 보기", desc: "" },
    { id: "초기", label: "임신 초기", desc: "1-13주" },
    { id: "중기", label: "임신 중기", desc: "14-27주" },
    { id: "후기", label: "임신 후기", desc: "28-40주" },
  ];

  const filtered = selPeriod === "전체" ? posts : posts.filter((p) => p.period === selPeriod || p.pregnancy_period === selPeriod);

  const addPost = async () => {
    if (!newTitle.trim() || !newPost.trim()) {
      alert("제목과 내용을 모두 입력해주세요!");
      return;
    }

    const targetPeriod = selPeriod === "전체" ? currentPeriod : selPeriod;

    const payload = {
      user_id: user.user_id || 1, 
      pregnancy_period: targetPeriod, 
      title: newTitle,
      content: newPost,
    };

    try {
      const res = await fetch("http://localhost:8000/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`에러 발생! 내용: ${JSON.stringify(errorData)}`);
        return;
      }

      const data = await res.json();
      if (data.status === "Success") {
        fetchPosts(); 
        setNewTitle("");
        setNewPost("");
        setShowForm(false);
      }
    } catch (e) {
      alert("글 작성에 실패했습니다. 서버를 확인해주세요.");
    }
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
        <div
          className="rounded-2xl p-4 flex items-center gap-3 text-sm shadow-sm"
          style={{ background: "#FDFDFD", border: "1px solid rgba(120,201,160,0.15)" }}
        >
          <span className="text-lg">👥</span>
          <p className="text-muted-foreground">
            현재 <span className="font-bold" style={{ color: "#69C99A" }}>임신 {currentPeriod}</span> ({currentWeek}주차)입니다
          </p>
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
                  style={{
                    background: isSelected ? "#78C9A0" : "#FCF0F4",
                    color: isSelected ? "white" : "#A68A94",
                    border: isSelected ? "none" : "1px solid rgba(201,78,112,0.05)",
                  }}
                >
                  <span className="font-bold text-[15px]">{period.label}</span>
                  {period.desc && (
                    <span className="text-[11px] mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#BFA6AE" }}>
                      {period.desc}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-4 rounded-2xl border-[1.5px] border-dashed font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#78C9A0]/5"
          style={{ borderColor: "#78C9A0", color: "#78C9A0" }}
        >
          <Plus size={18} strokeWidth={2.5} />
          {selPeriod === "전체" ? "임신 전체" : `임신 ${selPeriod}`} 이야기 나누기
        </button>

        {showForm && (
          <div className="bg-white rounded-2xl p-4 border border-border space-y-3 shadow-sm">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="글 제목을 입력하세요"
              className="w-full text-sm px-4 py-3 rounded-xl border border-border bg-[#FCF0F4]/30 focus:outline-none focus:border-[#78C9A0]"
            />
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="비슷한 시기의 분들과 경험을 나눠보세요 💙"
              rows={4}
              className="w-full text-sm px-4 py-3 rounded-xl border border-border bg-[#FCF0F4]/30 focus:outline-none focus:border-[#78C9A0] resize-none"
            />
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
            filtered.map((post) => (
              <div key={post.id || post.post_id} className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                
                {/* 프로필 정보 및 삭제 버튼 영역 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-[#FCF0F4]">
                      {post.avatar || "👤"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: post.role === "pregnant" ? "rgba(201,78,112,0.1)" : "rgba(123,104,181,0.1)", color: post.role === "pregnant" ? "#C94E70" : "#7B68B5" }}>
                          {post.role === "pregnant" ? "임산부" : "보호자"}
                        </span>
                        <p className="text-sm font-bold text-foreground">{post.author || "익명"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(120,201,160,0.1)", color: "#78C9A0" }}>
                          임신 {post.period || post.pregnancy_period}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {post.created_at ? timeAgo(post.created_at) : (post.time || "방금 전")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🚀 본인이 작성한 게시글일 때만 삭제 버튼 표시! */}
                  {user.user_id === post.user_id && (
                    <button 
                      onClick={() => deletePost(post.id || post.post_id)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  )}
                </div>

                {post.title && <p className="text-[15px] font-bold text-[#333] mb-1">{post.title}</p>}
                <p className="text-[14px] text-[#555] leading-relaxed mb-4">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
      {onNavigate && <BottomNav current="dashboard" onNavigate={onNavigate} />}
    </div>
  );
}