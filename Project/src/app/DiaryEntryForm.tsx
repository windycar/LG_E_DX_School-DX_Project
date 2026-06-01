import { apiUrl } from "./api";
import React, { useState, useRef } from "react";
import { X, Sparkles, Loader2, ImagePlus } from "lucide-react";

interface DiaryEntryFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function DiaryEntryForm({ onClose, onSave }: DiaryEntryFormProps) {
  // 오늘 날짜를 YYYY-MM-DD 형태로 예쁘게 뽑아내는 함수
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [entryDate, setEntryDate] = useState(getTodayDate()); // 🗓️ 날짜 상태 추가!
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResultLabel, setAiResultLabel] = useState<string>("");

  const MOODS = ["😡", "😔", "😫", "😟", "😐", "🙂", "🥰", "😊"]; 

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const analyzeEmotionWithAI = async () => {
    if (!content.trim()) { alert("일기 내용을 먼저 조금 작성해주세요!"); return; }
    setIsAnalyzing(true);
    try {
      const res = await fetch(apiUrl("/api/ai/emotion"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content })
      });
      const data = await res.json();
      
      if (data.status === "Success") {
        setMood(data.emoji); 
        setAiResultLabel(data.emotion_label); 
      } else { alert("AI 분석에 실패했습니다."); }
    } catch (error) { alert("서버 연결에 실패했습니다."); } 
    finally { setIsAnalyzing(false); }
  };

  const handleSave = () => {
    if (!content.trim()) { alert("내용을 입력해주세요."); return; }
    onSave({
      date: entryDate, // 🚀 선택한 날짜를 부모에게 전달!
      mood: mood || "😊",
      content: content,
      analyzedEmotion: aiResultLabel,
      image: imageFile 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-5 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl p-5 border border-border space-y-4 scrollbar-hide">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            ✍️ 오늘의 감정 일기
          </p>
          <button onClick={onClose}><X size={18} className="text-muted-foreground hover:text-red-400" /></button>
        </div>

        {/* 🗓️ 날짜 선택기 추가! */}
        <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl border border-border">
          <label className="text-xs font-bold text-foreground">기록할 날짜</label>
          <input 
            type="date" 
            value={entryDate} 
            onChange={(e) => setEntryDate(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm outline-none focus:border-primary bg-white"
          />
        </div>

        {/* 📸 사진 업로드 영역 */}
        <div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm"><X size={16} /></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-border rounded-xl text-muted-foreground flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors">
              <ImagePlus size={24} className="text-[#C94E70]/70" />
              <span className="text-xs font-semibold">오늘의 사진 추가하기 (선택)</span>
            </button>
          )}
        </div>
        
        {/* 본문 입력 */}
        <div className="relative">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="오늘 하루는 어땠나요? 일기를 길게 쓸수록 AI가 더 정확하게 감정을 분석해요!" rows={5} className="w-full text-sm px-3 py-2.5 rounded-xl border border-border resize-none outline-none focus:border-primary" />
          <button onClick={analyzeEmotionWithAI} disabled={isAnalyzing} className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md transition-transform active:scale-95 flex items-center gap-1.5 disabled:opacity-70" style={{ background: "linear-gradient(135deg, #7B68B5, #9B8EC4)" }}>
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isAnalyzing ? "분석 중..." : "AI 자동 감정 분석"}
          </button>
        </div>

        {/* 기분 표시/선택 영역 */}
        <div className="bg-[#FCF0F4]/30 rounded-xl p-3 border border-[#C94E70]/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-muted-foreground">{aiResultLabel ? `🤖 AI 분석 결과: ${aiResultLabel}` : "💡 직접 기분을 선택하거나 AI에게 맡겨보세요"}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button key={m} onClick={() => { setMood(m); setAiResultLabel(""); }} className="h-10 rounded-xl flex items-center justify-center text-xl transition-all" style={{ background: mood === m ? "rgba(201,78,112,0.15)" : "white", border: `1.5px solid ${mood === m ? "#C94E70" : "var(--border)"}` }}>{m}</button>
            ))}
          </div>
        </div>
        
        {/* 하단 버튼 */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-bold bg-secondary text-muted-foreground hover:bg-secondary/80">취소</button>
          <button onClick={handleSave} className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90 shadow-md" style={{ background: "#C94E70" }}>일기 저장하기</button>
        </div>
      </div>
    </div>
  );
}