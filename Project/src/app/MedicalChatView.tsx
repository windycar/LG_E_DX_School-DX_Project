import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { aiChatUrl } from "./api";

type ChatSource = { title: string; organization: string; url: string };
type ChatCareLevel = "information" | "clarify" | "contact_now" | "emergency";
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  careLevel?: ChatCareLevel;
  responseMode?: string;
};

const careLabels: Partial<Record<ChatCareLevel, { text: string; background: string; color: string }>> = {
  clarify: { text: "증상을 조금 더 알려주세요", background: "#F5F1E9", color: "#6B5D2D" },
  contact_now: { text: "지금 의료진 확인이 필요해요", background: "#FFF0E6", color: "#9A4D20" },
  emergency: { text: "즉시 도움을 요청하세요", background: "#FDECEC", color: "#A12828" },
};

export default function MedicalChatView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "안녕하세요! 임신 관련 의학 정보를 도와드리겠습니다. 궁금하신 점을 물어보세요." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch(aiChatUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(({ role, text, responseMode }) => ({ role, text, responseMode })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "상담 서버에서 응답을 받지 못했습니다.");
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: data.answer,
        sources: data.sources,
        careLevel: data.careLevel,
        responseMode: data.responseMode,
      }]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "상담 서버 연결에 실패했습니다.";
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: `현재 AI 상담을 연결할 수 없습니다. ${detail}`,
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 bg-card/90 backdrop-blur-sm border-b border-border">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-secondary transition-colors" aria-label="정보 화면으로 돌아가기">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-semibold text-foreground flex-1 ml-2">의학 정보 AI 상담</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] px-4 py-3 rounded-2xl"
              style={{
                background: msg.role === "user" ? "#C94E70" : "var(--card)",
                color: msg.role === "user" ? "white" : "var(--foreground)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
              }}
            >
              {msg.role === "assistant" && msg.careLevel && careLabels[msg.careLevel] && (
                <span
                  className="inline-block text-xs font-semibold rounded-full px-2.5 py-1 mb-2"
                  style={{
                    background: careLabels[msg.careLevel]!.background,
                    color: careLabels[msg.careLevel]!.color,
                  }}
                >
                  {careLabels[msg.careLevel]!.text}
                </span>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  {msg.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block text-xs font-medium underline break-words" style={{ color: "#2D7A9A" }}>
                      출처 보기: {source.organization} - {source.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 bg-card/90 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSendMessage()}
            placeholder="궁금한 점을 물어보세요..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
          />
          <button onClick={handleSendMessage} disabled={!input.trim() || sending} className="w-12 h-12 rounded-xl flex items-center justify-center text-white disabled:opacity-50" style={{ background: "#C94E70" }}>
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          이 정보는 의사 상담을 대체하지 않습니다. 심각한 증상은 즉시 병원을 방문하세요.
        </p>
      </div>
    </div>
  );
}
