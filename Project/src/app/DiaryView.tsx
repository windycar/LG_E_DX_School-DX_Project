import { apiUrl } from "./api";
import React, { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { AppUser, Screen } from "./types";
// @ts-ignore
import { BottomNav } from "./App";
import DiaryEntryForm from "./DiaryEntryForm";

const EVENT_TYPES = [
  { id: "hospital", label: "🏥 산부인과", color: "#7B68B5", bg: "rgba(123,104,181,0.1)" },
  { id: "ultrasound", label: "👶 정밀 초음파", color: "#69C99A", bg: "rgba(105,201,154,0.1)" },
  { id: "travel", label: "✈️ 태교 여행", color: "#FFAB76", bg: "rgba(255,171,118,0.1)" },
  { id: "photo", label: "📸 만삭 촬영", color: "#FFB3C6", bg: "rgba(255,179,198,0.1)" },
  { id: "fair", label: "🛍️ 베이비페어", color: "#4DB6AC", bg: "rgba(77,182,172,0.1)" },
  { id: "medicine", label: "💊 약/처방", color: "#64B5F6", bg: "rgba(100,181,246,0.1)" },
  { id: "etc", label: "📌 기타 일정", color: "#A1887F", bg: "rgba(161,136,127,0.1)" },
];

export default function DiaryView({ user, onNavigate }: { user: AppUser; onNavigate: (s: Screen) => void }) {
  const isPregnant = String(user.role).toUpperCase() === "PREGNANT";
  const userId = (user as any).id || (user as any).user_id;
  const identifier = userId || user.email;

  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]); 
  
  // 🚀 이제 가짜 데이터가 아니라 빈 배열([])로 시작합니다!
  const [entries, setEntries] = useState<any[]>([]);
  const [smalltalkEntries, setSmallTalkEntries] = useState<any[]>([]);

  // 1. 유저 정보 & 연동 코드 가져오기
  useEffect(() => {
    if (!identifier) return;
    fetch(apiUrl(`/api/user/info/${identifier}`))
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success") {
          setConnectionCode(isPregnant ? data.connection_code : data.partner_code);
        }
      })
      .catch(e => console.error("유저 정보 로드 실패:", e));
  }, [identifier, isPregnant]);

  // 2. 캘린더 공유 일정 불러오기
  const fetchEvents = () => {
    if (!connectionCode || connectionCode === "None") return;
    fetch(apiUrl(`/api/calendar/events/${connectionCode}`))
      .then(res => res.json())
      .then(data => {
        if (data.status === "Success" && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      });
  };

  // 🚀 3. DB에서 내 다이어리 일지 쫙 긁어오기 함수!
  const fetchEntries = () => {
    if (!userId) {
      console.warn("⚠️ userId가 없음");
      return;
    }
    console.log(`📥 다이어리 & 스몰토크 조회 시작: userId=${userId}`);
    fetch(apiUrl(`/api/diary/logs/${userId}`))
      .then(res => res.json())
      .then(data => {
        console.log("📊 API 응답:", data);
        if (data.status === "Success") {
          console.log(`✅ ${data.diary_entries?.length || 0}개 다이어리, ${data.smalltalk_entries?.length || 0}개 스몰토크`);
          console.log("💬 스몰토크:", data.smalltalk_entries);
          setEntries(data.diary_entries || []); 
          setSmallTalkEntries(data.smalltalk_entries || []);
        } else {
          console.warn("⚠️ API 응답 구조 오류:", data);
        }
      })
      .catch(e => console.error("❌ 조회 실패:", e));
  };

  useEffect(() => { fetchEvents(); }, [connectionCode]);
  
  // 화면이 켜지거나 로그인 정보가 있을 때 내 일기를 가져옵니다.
  useEffect(() => { fetchEntries(); }, [userId]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false); 
  const [expandedSmallTalkIds, setExpandedSmallTalkIds] = useState<Record<number, boolean>>({});

  const [showEventForm, setShowEventForm] = useState(false); 
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventContent, setNewEventContent] = useState(""); 
  const [newEventType, setNewEventType] = useState<string>("hospital");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const addEvent = async () => {
    if (!newEventDate || !newEventTitle.trim()) return;
    if (!connectionCode || connectionCode === "None") {
      alert("부부 연동 상태가 아닙니다. 설정에서 연동 코드를 먼저 연결해 주세요!");
      return;
    }
    const payload = {
      connection_code: connectionCode, event_type: newEventType,
      title: newEventTitle, content: newEventContent || "상세내용 없음", event_date: newEventDate
    };
    try {
      const res = await fetch(apiUrl("/api/calendar/events"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchEvents(); 
        setNewEventDate(""); setNewEventTitle(""); setNewEventContent(""); setNewEventType("hospital");
        setShowEventForm(false);
        setCurrentMonth(new Date(newEventDate));
      } else { alert("일정 등록 실패"); }
    } catch (e) { alert("서버 통신 오류"); }
  };

  const updateEvent = async () => {
    if (!selectedEvent.event_date || !selectedEvent.title.trim()) return;
    try {
      const res = await fetch(apiUrl(`/api/calendar/events/${selectedEvent.event_id}`), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: selectedEvent.event_type, title: selectedEvent.title,
          content: selectedEvent.content || "상세내용 없음", event_date: selectedEvent.event_date
        })
      });
      if (res.ok) { fetchEvents(); setIsEditing(false); } else { alert("일정 수정 실패"); }
    } catch (e) { alert("서버 통신 오류"); }
  };

  const deleteEvent = async (eventId: number) => {
    if (!window.confirm("이 일정을 정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(apiUrl(`/api/calendar/events/${eventId}`), { method: "DELETE" });
      if (res.ok) { fetchEvents(); setSelectedEvent(null); } else { alert("일정 삭제 실패"); }
    } catch (e) { alert("서버 통신 오류"); }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = new Date(year, month + 1, 0).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const entry = entries.find((e) => e.date === dateStr);
      const dayEvents = events.filter((e) => e.event_date === dateStr);
      const daySmallTalks = smalltalkEntries.filter((e) => e.date === dateStr);
      days.push({ day: i, date: dateStr, mood: entry?.mood, events: dayEvents, smalltalks: daySmallTalks });
    }
    const endPadding = 6 - lastDay;
    for (let i = 0; i < endPadding; i++) days.push(null);

    return days;
  };

  const filteredEntries = selectedDate ? entries.filter((e) => e.date === selectedDate) : entries;
  const filteredEvents = selectedDate ? events.filter((e) => e.event_date === selectedDate) : events;
  const filteredSmallTalk = selectedDate ? smalltalkEntries.filter((e) => e.date === selectedDate) : smalltalkEntries;
  const toggleSmallTalk = (entryId: number) => {
    setExpandedSmallTalkIds((prev) => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="px-5 pt-12 pb-5" style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FFF5F7 100%)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground">{!isPregnant ? "보호자 캘린더" : "나의 임신 캘린더"}</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Nanum Myeongjo', serif", color: "#2D1B33" }}>
              다이어리
            </h2>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: "linear-gradient(135deg, #C94E70, #E8789A)" }}>
            <Plus size={20} />
          </button>
        </div>

        {/* 달력 영역 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1 hover:bg-secondary rounded-full transition-colors active:scale-95">
                <ChevronLeft size={18} className="text-muted-foreground" />
              </button>
              <p className="text-sm font-semibold text-foreground w-20 text-center">
                {currentMonth.toLocaleDateString("ko-KR", { year: "numeric", month: "short" })}
              </p>
              <button onClick={nextMonth} className="p-1 hover:bg-secondary rounded-full transition-colors active:scale-95">
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            </div>
            <button onClick={() => setShowEventForm(true)} className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}>
              + 일정
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((item, i) => {
              if (!item) return <div key={`empty-${i}`} className="aspect-square" />;
              
              // 🚀 일정이나 다이어리(이모지)가 하나라도 있는지 체크!
              const hasSchedule = item.events.length > 0 || item.mood || item.smalltalks.length > 0;
              const isSelected = selectedDate === item.date;

              return (
                <button
                  key={`day-${i}`}
                  onClick={() => setSelectedDate(isSelected ? null : item.date)}
                  className="aspect-square flex flex-col items-center p-1 rounded-xl transition-all relative"
                  style={{
                    background: isSelected ? "rgba(201,78,112,0.05)" : "transparent",
                  }}
                >
                  {/* 1. 상단: 날짜 */}
                  <div 
                    className="mt-0.5 flex items-center justify-center w-[22px] h-[22px] rounded-md transition-colors"
                    style={{
                      // 🚀 일정이 있을 때만 예쁜 분홍색 얇은 선! 선택하면 색상 채우기!
                      border: hasSchedule && !isSelected ? "1px solid #C94E70" : "1px solid transparent",
                      backgroundColor: isSelected ? "#C94E70" : "transparent",
                      color: isSelected ? "#FFFFFF" : "var(--foreground)",
                    }}
                  >
                    <span className="font-bold text-[11px] leading-none mt-[1px]">
                      {item.day}
                    </span>
                  </div>
                  
                  {/* 2. 중단: 이모지 (절대 안 겹치게 Flex로 남는 공간 꽉 잡기) */}
                  <div className="flex-1 flex items-center justify-center w-full">
                    {item.mood && <span className="text-[17px] leading-none drop-shadow-sm">{item.mood}</span>}
                  </div>
                  
                  {/* 3. 하단: 일정 점 (바닥에 얌전히 고정) */}
                  <div className="h-1.5 w-full flex justify-center items-center gap-[3px] mb-0.5">
                    {item.events.length > 0 && item.events.slice(0, 3).map((e: any, idx: number) => {
                      const typeInfo = EVENT_TYPES.find(t => t.id === e.event_type) || EVENT_TYPES[6];
                      return <span key={`dot-${idx}`} className="w-[4.5px] h-[4.5px] rounded-full shadow-sm" style={{ background: typeInfo.color }} />
                    })}
                    {item.smalltalks.length > 0 && <span className="w-[4.5px] h-[4.5px] rounded-full shadow-sm" style={{ background: "#F48FB1" }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 flex-1 overflow-y-auto">
        {/* 공유 일정 추가 폼 */}
        {showEventForm && (
          <div className="bg-card rounded-2xl p-5 border border-border space-y-4 mb-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <p className="text-sm font-bold text-foreground">📅 부부 공유 일정 추가</p>
              <button onClick={() => setShowEventForm(false)}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">날짜</label>
                  <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none focus:border-primary" />
                </div>
                <div className="flex-[2]">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">일정 제목</label>
                  <input type="text" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="예: 정밀 초음파 검사" className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">상세 메모</label>
                <input type="text" value={newEventContent} onChange={(e) => setNewEventContent(e.target.value)} placeholder="메모를 입력하세요 (생략 가능)" className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-2">일정 종류 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map(type => (
                    <button key={type.id} type="button" onClick={() => setNewEventType(type.id)} className="py-2 px-2 rounded-xl text-[12px] font-bold transition-all text-left flex items-center gap-1.5" style={{ background: newEventType === type.id ? type.color : "#FCF0F4", color: newEventType === type.id ? "white" : "#888" }}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={addEvent} disabled={!newEventDate || !newEventTitle.trim()} className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: "#C94E70" }}>
              공유 캘린더에 등록하기
            </button>
          </div>
        )}

        {/* 공유 일정 리스트 */}
        {(selectedDate ? filteredEvents : events).length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-bold text-foreground mb-3">
              <span style={{ color: "#C94E70" }}>{selectedDate ? "📍 선택한 날짜의 공유 일정" : "📣 전체 공유 일정 목록"}</span>
            </p>
            <div className="space-y-2">
              {(selectedDate ? filteredEvents : events)
                .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                .slice(0, selectedDate ? undefined : 4)
                .map((event) => {
                  const typeInfo = EVENT_TYPES.find(t => t.id === event.event_type) || EVENT_TYPES[6];
                  return (
                    <div key={`event-${event.event_id}`} onClick={() => setSelectedEvent(event)} className="bg-white rounded-xl p-3.5 border border-border flex items-center gap-3 shadow-sm cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: typeInfo.bg }}>{typeInfo.label.split(" ")[0]}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: typeInfo.bg, color: typeInfo.color }}>{typeInfo.label.substring(2)}</span>
                          <p className="text-sm font-bold text-foreground">{event.title}</p>
                        </div>
                        {event.content && event.content !== "상세내용 없음" && <p className="text-xs text-muted-foreground/90 mb-1 pl-1 truncate">📝 {event.content}</p>}
                        <p className="text-xs text-muted-foreground font-medium">{new Date(event.event_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</p>
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {/* 🚀 분할된 일기 쓰기 폼 모달 */}
        {showForm && (
          <DiaryEntryForm 
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              const formData = new FormData();
              formData.append("user_id", userId.toString());
              formData.append("selected_emotion", data.mood);
              formData.append("diary_content", data.content);
              
              if (data.analyzedEmotion) formData.append("detected_emotion", data.analyzedEmotion);
              if (data.image) formData.append("image", data.image);

              try {
                const res = await fetch(apiUrl("/api/diary/logs"), {
                  method: "POST", body: formData 
                });
                
                if (res.ok) {
                  alert("일기와 사진이 성공적으로 저장되었습니다!");
                  setShowForm(false);
                  
                  // 🚀 DB 저장이 끝났으니 목록을 다시 긁어와서 최신 상태로 새로고침!
                  fetchEntries(); 
                } else { alert("DB 저장에 실패했습니다."); }
              } catch (e) { alert("서버 연결 실패!"); }
            }}
          />
        )}

        {/* 내 일지 리스트 영역 */}
        {selectedDate && (
          <div className="mb-3 flex items-center justify-between border-t border-border/50 pt-4 mt-2">
            <p className="text-sm font-bold" style={{ color: "#C94E70" }}>
              {new Date(selectedDate).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 다이어리 글
            </p>
            <button onClick={() => setSelectedDate(null)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">
              달력 전체보기
            </button>
          </div>
        )}

        {/* 📝 다이어리 섹션 */}
        {selectedDate && <div className="space-y-3 pb-5">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-3xl mb-3">📖</p>
              <p className="text-sm font-medium">선택된 날에 작성된 감정 일지가 없습니다</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={`entry-${entry.id}`} className="space-y-3">
                {/* 일반 다이어리 카드 */}
                <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{entry.mood}</span>
                    <p className="text-xs font-bold text-muted-foreground">{new Date(entry.date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</p>
                  </div>
                  
                  {/* 📸 사진 뿌려주기! */}
                  {entry.images && entry.images.length > 0 && (
                    <img src={entry.images[0]} alt="diary" className="w-full rounded-xl object-cover aspect-video mb-3 border border-border/50 bg-secondary/30" />
                  )}
                  
                  <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                </div>

                {/* 🚀 다이어리 날짜의 스몰토크도 함께 표시 */}
                {selectedDate && entry.smalltalk && filteredSmallTalk.length === 0 && (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💕</span>
                        <p className="text-xs font-bold text-pink-600">그날의 스몰토크</p>
                      </div>
                      <button
                        onClick={() => toggleSmallTalk(entry.id)}
                        className="text-xs px-3 py-1.5 rounded-full font-bold"
                        style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}
                      >
                        {expandedSmallTalkIds[entry.id] ? "닫기" : "보기"}
                      </button>
                    </div>
                    
                    {expandedSmallTalkIds[entry.id] && <div className="space-y-3 mt-3">
                      {/* 질문 */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">❓ 질문</p>
                        <p className="text-sm font-medium text-foreground leading-relaxed">{entry.smalltalk.topic}</p>
                      </div>

                      {/* 내 답변 */}
                      <div className="bg-white/70 rounded-xl p-3 border border-pink-100">
                        <p className="text-xs font-semibold text-pink-600 mb-1">💬 내 답변</p>
                        <p className="text-sm text-foreground leading-relaxed">{entry.smalltalk.my_answer}</p>
                      </div>

                      {/* 파트너 답변 */}
                      <div className="bg-white/70 rounded-xl p-3 border border-purple-100">
                        <p className="text-xs font-semibold text-purple-600 mb-1">💬 파트너의 답변</p>
                        <p className="text-sm text-foreground leading-relaxed">{entry.smalltalk.partner_answer}</p>
                      </div>
                    </div>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>}

        {selectedDate && filteredSmallTalk.length > 0 && (
          <div className="space-y-3 pb-20">
            {filteredSmallTalk.map((st) => (
              <div key={`selected-smalltalk-${st.id}`} className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-200 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💕</span>
                    <p className="text-xs font-bold text-pink-600">그날의 스몰토크</p>
                  </div>
                  <button
                    onClick={() => toggleSmallTalk(st.id)}
                    className="text-xs px-3 py-1.5 rounded-full font-bold"
                    style={{ background: "rgba(201,78,112,0.1)", color: "#C94E70" }}
                  >
                    {expandedSmallTalkIds[st.id] ? "닫기" : "보기"}
                  </button>
                </div>

                {expandedSmallTalkIds[st.id] && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">❓ 질문</p>
                      <p className="text-sm font-medium text-foreground leading-relaxed">{st.topic}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 border border-pink-100">
                      <p className="text-xs font-semibold text-pink-600 mb-1">💬 내 답변</p>
                      <p className="text-sm text-foreground leading-relaxed">{st.my_answer}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 border border-purple-100">
                      <p className="text-xs font-semibold text-purple-600 mb-1">💬 파트너의 답변</p>
                      <p className="text-sm text-foreground leading-relaxed">{st.partner_answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
      
      <BottomNav current="diary" onNavigate={onNavigate} />

      {/* 공유 일정 수정 모달 */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                {isEditing && <button onClick={() => setIsEditing(false)} className="p-1 -ml-2 text-muted-foreground"><ChevronLeft size={20} /></button>}
                <p className="font-bold text-foreground">{isEditing ? "일정 수정" : "일정 상세"}</p>
              </div>
              <button onClick={() => { setSelectedEvent(null); setIsEditing(false); }} className="text-muted-foreground hover:bg-secondary p-1 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                   <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">날짜</label>
                    <input type="date" value={selectedEvent.event_date} onChange={(e) => setSelectedEvent({...selectedEvent, event_date: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">제목</label>
                    <input type="text" value={selectedEvent.title} onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">상세 메모</label>
                    <textarea value={selectedEvent.content === "상세내용 없음" ? "" : selectedEvent.content} onChange={(e) => setSelectedEvent({...selectedEvent, content: e.target.value})} rows={3} className="w-full px-3 py-2 rounded-xl border border-border text-sm resize-none outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">유형 변경</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map(type => (
                        <button key={type.id} onClick={() => setSelectedEvent({...selectedEvent, event_type: type.id})} className="py-2 px-2 rounded-xl text-[11px] font-bold transition-all text-left flex items-center gap-1.5" style={{ background: selectedEvent.event_type === type.id ? type.color : "#FCF0F4", color: selectedEvent.event_type === type.id ? "white" : "#888" }}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={updateEvent} className="w-full py-3 mt-2 rounded-xl text-sm font-bold text-white" style={{ background: "#78C9A0" }}>수정 완료</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const tInfo = EVENT_TYPES.find(t => t.id === selectedEvent.event_type) || EVENT_TYPES[6];
                      return (
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: tInfo.bg }}>{tInfo.label.split(" ")[0]}</div>
                      );
                    })()}
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: (EVENT_TYPES.find(t => t.id === selectedEvent.event_type) || EVENT_TYPES[6]).bg, color: (EVENT_TYPES.find(t => t.id === selectedEvent.event_type) || EVENT_TYPES[6]).color }}>
                        {(EVENT_TYPES.find(t => t.id === selectedEvent.event_type) || EVENT_TYPES[6]).label.substring(2)}
                      </span>
                      <p className="text-lg font-bold text-foreground mt-1">{selectedEvent.title}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#FCF0F4]/50 rounded-xl p-4 mt-4 space-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold mb-0.5">🗓️ 일시</p>
                      <p className="text-sm font-medium text-foreground">{new Date(selectedEvent.event_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p>
                    </div>
                    {selectedEvent.content && selectedEvent.content !== "상세내용 없음" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground font-semibold mb-0.5">📝 상세 메모</p>
                        <p className="text-sm font-medium text-foreground">{selectedEvent.content}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-secondary text-foreground flex items-center justify-center gap-1.5"><Edit2 size={16} /> 수정</button>
                    <button onClick={() => deleteEvent(selectedEvent.event_id)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-500 flex items-center justify-center gap-1.5"><Trash2 size={16} /> 삭제</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
