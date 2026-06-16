import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  Heart,
  LogIn,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
  Users,
} from "lucide-react";
import { apiUrl } from "./api";
import { AppUser, Role } from "./types";

type AdminUserRow = {
  user_id: number;
  name: string;
  email: string;
  role: string;
  pregnancy_start_date: string | null;
  pregnancy_week: number | null;
  baby_nickname: string | null;
  connection_code: string | null;
  parent_user_id: number | null;
};

type AdminCommentRow = {
  comment_id: number;
  post_id: number;
  user_id: number | null;
  author: string;
  content: string;
  created_at: string | null;
};

type AdminPostRow = {
  post_id: number;
  user_id: number | null;
  author: string;
  pregnancy_period: string | null;
  title: string | null;
  content: string | null;
  created_at: string | null;
  comment_count: number;
  like_count: number;
  comments: AdminCommentRow[];
};

type AdminOverview = {
  status: string;
  stats: {
    total_users: number;
    pregnant_users: number;
    guardian_users: number;
    today_active_users: number;
    community_posts: number;
    community_comments: number;
    diary_logs: number;
    status_checks: number;
    guardian_missions: number;
    appliance_settings: number;
  };
  users: AdminUserRow[];
  posts: AdminPostRow[];
  analytics: {
    period_distribution: Array<{ label: string; count: number }>;
    emotion_distribution: Array<{ label: string; count: number }>;
    appliance_distribution: Array<{ label: string; count: number }>;
    keyword_distribution: Array<{ label: string; count: number }>;
    environment_average: {
      felt_temperature: number | null;
      felt_humidity: number | null;
    };
    appliance_average: {
      target_temperature: number | null;
      target_humidity: number | null;
      mood_light_brightness: number | null;
      aircon_fan: number | null;
      air_purifier_speed: number | null;
    };
  };
};

type TextAnalysisResult = {
  total_documents: number;
  total_tokens: number;
  top_words: Array<{ word: string; count: number }>;
  sentiment_hint: Array<{ label: string; count: number }>;
  used_stopwords: string[];
};

const roleMeta = (role: string) => {
  const normalized = role?.toUpperCase();
  if (normalized === "PREGNANT") return { label: "임산부", emoji: "🤰", color: "#C94E70" };
  if (normalized === "GUARDIAN") return { label: "보호자", emoji: "🧑‍🍼", color: "#7B68B5" };
  if (normalized === "ADMIN") return { label: "관리자", emoji: "🛡️", color: "#2D1B4E" };
  return { label: role || "미지정", emoji: "👤", color: "#6B7280" };
};

const toAppRole = (role: string): Role => {
  const normalized = role?.toUpperCase();
  if (normalized === "PREGNANT") return "pregnant";
  if (normalized === "ADMIN") return "admin";
  return "guardian";
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border text-center">
      <p className="font-bold text-xl" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function BarList({ title, rows, color }: { title: string; rows: Array<{ label: string; count: number }>; color: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="bg-card rounded-2xl p-4 border border-border">
      <p className="text-sm font-bold text-foreground mb-3">{title}</p>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">표시할 데이터가 없습니다.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{row.label || "미지정"}</span>
                <span className="font-semibold text-foreground">{row.count}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: color }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function WordCloud({ words }: { words: Array<{ word: string; count: number }> }) {
  const max = Math.max(1, ...words.map((word) => word.count));
  if (words.length === 0) {
    return <p className="text-xs text-muted-foreground">분석 결과가 없습니다. 불용어를 조정하고 다시 실행해보세요.</p>;
  }
  return (
    <div className="bg-card rounded-2xl p-4 border border-border min-h-[180px] flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {words.slice(0, 35).map((word, index) => {
        const size = 12 + Math.round((word.count / max) * 22);
        const colors = ["#7B68B5", "#C94E70", "#69C99A", "#E8789A", "#4D8AF0"];
        return (
          <span
            key={`${word.word}-${index}`}
            className="font-bold leading-none"
            style={{ fontSize: size, color: colors[index % colors.length], opacity: 0.72 + (word.count / max) * 0.28 }}
            title={`${word.word}: ${word.count}`}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
}

export default function AdminView({
  user,
  onLogout,
  onImpersonate,
}: {
  user: AppUser;
  onLogout: () => void;
  onImpersonate: (user: AppUser) => void;
}) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [tab, setTab] = useState<"users" | "community" | "analytics">("users");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stopwordInput, setStopwordInput] = useState("");
  const [stopwords, setStopwords] = useState<string[]>(["오늘", "진짜", "너무"]);
  const [stopwordSaving, setStopwordSaving] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const adminIdentifier = user.user_id || user.email;

  const loadOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/api/admin/overview/${encodeURIComponent(String(adminIdentifier))}`));
      const json = await res.json();
      if (!res.ok || json.status !== "Success") {
        throw new Error(json.detail || json.message || "관리자 데이터를 불러오지 못했습니다.");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "관리자 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadStopwords = async () => {
    try {
      const res = await fetch(apiUrl(`/api/admin/community/stopwords/${encodeURIComponent(String(adminIdentifier))}`));
      const json = await res.json();
      if (!res.ok || json.status !== "Success") {
        throw new Error(json.detail || json.message || "불용어를 불러오지 못했습니다.");
      }
      setStopwords(json.stopwords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불용어를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    loadOverview();
    loadStopwords();
  }, [adminIdentifier]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const users = data?.users || [];
    if (!keyword) return users;
    return users.filter((row) => `${row.name} ${row.email} ${row.role}`.toLowerCase().includes(keyword));
  }, [data, search]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const posts = data?.posts || [];
    if (!keyword) return posts;
    return posts.filter((row) => `${row.author} ${row.title || ""} ${row.content || ""}`.toLowerCase().includes(keyword));
  }, [data, search]);

  const impersonate = (row: AdminUserRow) => {
    if (String(row.role).toUpperCase() === "ADMIN") return;
    onImpersonate({
      name: row.name || row.email,
      nickname: row.name || row.email,
      babyNickname: row.baby_nickname || "아기",
      email: row.email,
      role: toAppRole(row.role),
      pregnancyWeek: row.pregnancy_week || 0,
      user_id: row.user_id,
      parent_user_id: row.parent_user_id,
      inviteCode: row.connection_code || undefined,
    });
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm("이 회원과 연결된 주요 데이터를 삭제할까요?")) return;
    const res = await fetch(apiUrl(`/api/admin/users/${userId}?admin_identifier=${encodeURIComponent(String(adminIdentifier))}`), { method: "DELETE" });
    if (!res.ok) {
      alert("회원 삭제에 실패했습니다.");
      return;
    }
    loadOverview();
  };

  const deletePost = async (postId: number) => {
    if (!window.confirm("이 게시글을 삭제할까요? 댓글도 함께 삭제됩니다.")) return;
    const res = await fetch(apiUrl(`/api/admin/community/posts/${postId}?admin_identifier=${encodeURIComponent(String(adminIdentifier))}`), { method: "DELETE" });
    if (!res.ok) {
      alert("게시글 삭제에 실패했습니다.");
      return;
    }
    loadOverview();
  };

  const deleteComment = async (commentId: number) => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    const res = await fetch(apiUrl(`/api/admin/community/comments/${commentId}?admin_identifier=${encodeURIComponent(String(adminIdentifier))}`), { method: "DELETE" });
    if (!res.ok) {
      alert("댓글 삭제에 실패했습니다.");
      return;
    }
    loadOverview();
  };

  const saveStopwords = async (nextStopwords: string[]) => {
    setStopwordSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/community/stopwords/${encodeURIComponent(String(adminIdentifier))}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopwords: nextStopwords }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "Success") {
        throw new Error(json.detail || json.message || "불용어 저장에 실패했습니다.");
      }
      setStopwords(json.stopwords);
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "불용어 저장에 실패했습니다.");
      return false;
    } finally {
      setStopwordSaving(false);
    }
  };

  const addStopword = async () => {
    const word = stopwordInput.trim();
    if (!word || stopwords.includes(word)) return;
    if (await saveStopwords([...stopwords, word])) {
      setStopwordInput("");
    }
  };

  const removeStopword = async (word: string) => {
    await saveStopwords(stopwords.filter((item) => item !== word));
  };

  const runCommunityAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/community/analyze/${encodeURIComponent(String(adminIdentifier))}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopwords }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== "Success") {
        throw new Error(json.detail || json.message || "분석에 실패했습니다.");
      }
      setTextAnalysis(json.analysis);
    } catch (err) {
      alert(err instanceof Error ? err.message : "분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs: Array<{ id: "users" | "community" | "analytics"; label: string; icon: typeof Users }> = [
    { id: "users", label: "회원", icon: Users },
    { id: "community", label: "커뮤니티", icon: MessageSquare },
    { id: "analytics", label: "커뮤니티 분석", icon: BarChart2 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-3 text-muted-foreground" size={28} />
          <p className="text-sm text-muted-foreground">관리자 데이터를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <AlertTriangle className="mx-auto mb-3" size={32} style={{ color: "#C94E70" }} />
          <p className="font-bold text-foreground">관리자 화면을 열 수 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <button onClick={onLogout} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#C94E70" }}>
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-12 pb-5" style={{ background: "linear-gradient(160deg, #1A0E2E 0%, #2D1B4E 100%)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} style={{ color: "#B9A9FF" }} />
              <p className="text-xs font-medium" style={{ color: "#B9A9FF" }}>관리자 모드</p>
            </div>
            <h2 className="text-2xl font-bold text-white">MOMent Admin</h2>
            <p className="text-xs mt-1" style={{ color: "#B9A9FF" }}>{user.email}</p>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "#B9A9FF" }}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="전체 회원" value={data.stats.total_users} color="#B9A9FF" />
          <StatCard label="게시글" value={data.stats.community_posts} color="#FF9AB5" />
          <StatCard label="오늘 접속자" value={data.stats.today_active_users} color="#69C99A" />
        </div>
      </header>

      <nav className="flex bg-card sticky top-0 z-10 px-3 py-2 gap-2">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: tab === id ? "rgba(123,104,181,0.12)" : "transparent",
              color: tab === id ? "#7B68B5" : "var(--muted-foreground)",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <main className="px-4 py-5 flex-1 overflow-y-auto pb-10 space-y-4">
        {tab !== "analytics" && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === "users" ? "회원 이름, 이메일 검색" : "게시글, 작성자 검색"}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary"
          />
        </div>
        )}

        {tab === "users" && (
          <section className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="🤰 임산부" value={data.stats.pregnant_users} color="#C94E70" />
              <StatCard label="🧑‍🍼 보호자" value={data.stats.guardian_users} color="#7B68B5" />
              <StatCard label="상태체크" value={data.stats.status_checks} color="#69C99A" />
            </div>
            {filteredUsers.map((row) => {
              const meta = roleMeta(row.role);
              const isAdmin = String(row.role).toUpperCase() === "ADMIN" || row.email === "admin";
              return (
                <article key={row.user_id} className="bg-card rounded-2xl p-4 border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground">
                          <span className="mr-1">{meta.emoji}</span>
                          {row.name || "이름 없음"}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${meta.color}1A`, color: meta.color }}>
                          {meta.label}
                        </span>
                        {row.pregnancy_week !== null && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}>
                            {row.pregnancy_week}주차
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{row.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID {row.user_id} · 시작일 {row.pregnancy_start_date || "-"} · 연결코드 {row.connection_code || "-"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!isAdmin && (
                        <button onClick={() => impersonate(row)} className="p-2 rounded-xl border border-border" style={{ color: "#7B68B5" }} title="회원 대리접속">
                          <LogIn size={15} />
                        </button>
                      )}
                      <button onClick={() => deleteUser(row.user_id)} className="p-2 rounded-xl border border-border" style={{ color: "#C94E70" }} title="회원 삭제">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {tab === "community" && (
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="댓글" value={data.stats.community_comments} color="#7B68B5" />
              <StatCard label="오늘 접속자" value={data.stats.today_active_users} color="#69C99A" />
            </div>
            {filteredPosts.map((post) => (
              <article key={post.post_id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-foreground">{post.author}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(105,201,154,0.12)", color: "#69C99A" }}>
                      {post.pregnancy_period || "일반"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(post.created_at)}</span>
                  </div>
                  {post.title && <p className="font-bold text-sm text-foreground mb-1">{post.title}</p>}
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>댓글 {post.comment_count}개</span>
                      <span className="inline-flex items-center gap-1" style={{ color: "#C94E70" }}>
                        <Heart size={12} fill="#C94E70" />
                        {post.like_count || 0}
                      </span>
                    </div>
                    <button onClick={() => deletePost(post.post_id)} className="text-xs px-2 py-1 rounded-lg border border-border flex items-center gap-1" style={{ color: "#C94E70" }}>
                      <Trash2 size={12} /> 삭제
                    </button>
                  </div>
                </div>
                {post.comments.length > 0 && (
                  <div className="border-t border-border bg-secondary/20">
                    {post.comments.map((comment) => (
                      <div key={comment.comment_id} className="px-4 py-3 border-b border-border/50 last:border-0 flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold text-foreground">{comment.author}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
                        </div>
                        <button onClick={() => deleteComment(comment.comment_id)} className="p-1 rounded-lg" style={{ color: "#C94E70" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        {tab === "analytics" && (
          <section className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "rgba(123,104,181,0.06)", border: "1.5px solid rgba(123,104,181,0.14)" }}>
              <p className="text-sm font-bold" style={{ color: "#7B68B5" }}>LG DX School 커뮤니티 텍스트 분석</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                커뮤니티 게시글과 댓글을 기반으로 임신 시기, 주요 키워드, 감정 경향을 집계해 서비스 개선용 데이터 분석 지표로 보여줍니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="만족 평균 온도" value={data.analytics.appliance_average.target_temperature ?? 0} color="#C94E70" />
              <StatCard label="만족 평균 습도" value={data.analytics.appliance_average.target_humidity ?? 0} color="#4D8AF0" />
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-sm font-bold text-foreground mb-3">임산부 평균 가전 세팅</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">에어컨 목표 온도</p>
                  <p className="font-bold text-foreground">{data.analytics.appliance_average.target_temperature ?? "-"}℃</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">목표 습도</p>
                  <p className="font-bold text-foreground">{data.analytics.appliance_average.target_humidity ?? "-"}%</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">무드등 밝기</p>
                  <p className="font-bold text-foreground">{data.analytics.appliance_average.mood_light_brightness ?? "-"}%</p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">공기청정 풍량</p>
                  <p className="font-bold text-foreground">{data.analytics.appliance_average.air_purifier_speed ?? "-"}단</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground">Kiwi 형태소 분석 워드클라우드</p>
                <p className="text-xs text-muted-foreground mt-1">불용어를 하나씩 추가한 뒤 분석 버튼을 누르면 커뮤니티 전체 글과 댓글을 다시 분석합니다.</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={stopwordInput}
                  onChange={(event) => setStopwordInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && addStopword()}
                  placeholder="불용어 입력"
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={addStopword} disabled={stopwordSaving} className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60" style={{ background: "#7B68B5" }}>
                  {stopwordSaving ? "저장 중" : "추가"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {stopwords.map((word) => (
                  <button key={word} onClick={() => removeStopword(word)} disabled={stopwordSaving} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-xs text-muted-foreground disabled:opacity-60">
                    {word}
                    <X size={12} />
                  </button>
                ))}
              </div>
              <button onClick={runCommunityAnalysis} disabled={analyzing} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "#C94E70" }}>
                {analyzing ? "분석 중..." : "커뮤니티 전체 Kiwi 분석 실행"}
              </button>
              <WordCloud words={textAnalysis?.top_words || []} />
              {textAnalysis && (
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="분석 문서" value={textAnalysis.total_documents} color="#7B68B5" />
                  <StatCard label="분석 토큰" value={textAnalysis.total_tokens} color="#69C99A" />
                  <StatCard label="불용어" value={stopwords.length} color="#C94E70" />
                </div>
              )}
            </div>
            <BarList title="임신 시기별 게시글 분포" rows={data.analytics.period_distribution} color="#7B68B5" />
            <BarList title="커뮤니티 주요 키워드" rows={(textAnalysis?.top_words || []).map((row) => ({ label: row.word, count: row.count })).concat(!textAnalysis ? data.analytics.keyword_distribution : [])} color="#69C99A" />
            <BarList title="일기 감정 참고 분포" rows={data.analytics.emotion_distribution} color="#C94E70" />
            <div className="rounded-2xl p-4" style={{ background: "rgba(123,104,181,0.06)", border: "1.5px dashed rgba(123,104,181,0.25)" }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={15} style={{ color: "#7B68B5" }} />
                <p className="text-xs font-bold" style={{ color: "#7B68B5" }}>실제 DB 연동 상태</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                회원, 커뮤니티, 댓글, 상태체크, 가전 설정 집계를 백엔드 API에서 조회합니다.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
