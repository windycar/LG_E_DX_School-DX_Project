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
  const MOOD_LABELS: Record<string, string> = {
    "😡": "화남",
    "😔": "우울",
    "😫": "힘듦",
    "😟": "불안",
    "😐": "보통",
    "🙂": "괜찮음",
    "🥰": "사랑스러움",
    "😊": "행복",
  };

  const ruleBasedEmotion = (text: string) => {
    const weights: Record<string, { emoji: string; score: number }> = {
      화남: { emoji: "😡", score: 0 },
      우울: { emoji: "😔", score: 0 },
      힘듦: { emoji: "😫", score: 0 },
      불안: { emoji: "😟", score: 0 },
      보통: { emoji: "😐", score: 0.4 },
      괜찮음: { emoji: "🙂", score: 0 },
      사랑스러움: { emoji: "🥰", score: 0 },
      행복: { emoji: "😊", score: 0 },
    };
    const lexicon: Array<{ label: keyof typeof weights; words: string[]; score: number }> = [
      { label: "화남", score: 2.2, words: ["화가", "화남", "짜증", "분노", "열받", "빡", "피해다니", "싫다"] },
      { label: "우울", score: 2.0, words: ["우울", "슬프", "눈물", "외롭", "속상", "무기력", "서럽"] },
      { label: "힘듦", score: 1.8, words: ["힘들", "지침", "피곤", "아픔", "통증", "입덧", "못자", "버겁"] },
      { label: "불안", score: 2.0, words: ["불안", "걱정", "무섭", "두렵", "초조", "긴장", "혹시"] },
      { label: "괜찮음", score: 1.8, words: ["괜찮", "풀렸", "나아졌", "안정", "차분", "버틸만"] },
      { label: "행복", score: 2.0, words: ["행복", "좋았", "기쁘", "웃", "편안", "고마", "다행"] },
      { label: "사랑스러움", score: 2.0, words: ["사랑", "태동", "아기", "설렘", "소중", "귀여"] },
    ];
    const sentences = text
      .toLowerCase()
      .split(/[.!?\n。！？]/)
      .map((part) => part.trim())
      .filter(Boolean);
    const targetSentences = sentences.length ? sentences : [text.toLowerCase()];

    targetSentences.forEach((sentence, index) => {
      let multiplier = 1;
      if (index === targetSentences.length - 1) multiplier += 0.4;
      if (/(하지만|그래도|근데|그런데|결국|다행히|그래서)/.test(sentence)) multiplier += 0.8;
      if (/(아니|않|안 |못 |없)/.test(sentence)) multiplier -= 0.25;

      lexicon.forEach((rule) => {
        const hitCount = rule.words.filter((word) => sentence.includes(word)).length;
        if (hitCount > 0) weights[rule.label].score += rule.score * hitCount * Math.max(0.4, multiplier);
      });
    });

    if (/(마음이 풀|괜찮아졌|나아졌|고마웠|다행)/.test(text)) {
      weights.화남.score *= 0.45;
      weights.불안.score *= 0.7;
      weights.괜찮음.score += 1.5;
      weights.행복.score += 0.8;
    }

    const result = Object.entries(weights).sort((a, b) => b[1].score - a[1].score)[0];
    return { label: result[0], emoji: result[1].emoji, score: result[1].score.toFixed(1) };
  };

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
        const corrected = ruleBasedEmotion(content);
        setMood(corrected.emoji); 
        setAiResultLabel(`${corrected.label} · 맥락 가중치 ${corrected.score}`); 
      } else { alert("AI 분석에 실패했습니다."); }
    } catch (error) {
      const corrected = ruleBasedEmotion(content);
      setMood(corrected.emoji);
      setAiResultLabel(`${corrected.label} · 로컬 가중치 ${corrected.score}`);
    } 
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
            <p className="text-[11px] font-bold text-muted-foreground">
              {aiResultLabel ? `🤖 분석 결과: ${aiResultLabel}` : mood ? `선택한 감정: ${MOOD_LABELS[mood]}` : "💡 직접 기분을 선택하거나 분석을 눌러보세요"}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button key={m} onClick={() => { setMood(m); setAiResultLabel(""); }} className="h-12 rounded-xl flex flex-col items-center justify-center text-lg transition-all" style={{ background: mood === m ? "rgba(201,78,112,0.15)" : "white", border: `1.5px solid ${mood === m ? "#C94E70" : "var(--border)"}` }}>
                <span>{m}</span>
                {mood === m && <span className="text-[10px] font-bold" style={{ color: "#C94E70" }}>{MOOD_LABELS[m]}</span>}
              </button>
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
