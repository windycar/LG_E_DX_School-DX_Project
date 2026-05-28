import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "127.0.0.1";
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const allowedDevOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/;
const knowledgePath = path.resolve(__dirname, "trusted-knowledge.json");
const aiGenerationEnabled =
  process.env.ENABLE_AI_GENERATION === "true" && Boolean(process.env.OPENAI_API_KEY);
const semanticRetrievalEnabled =
  process.env.ENABLE_SEMANTIC_RETRIEVAL === "true" && Boolean(process.env.OPENAI_API_KEY);
const minimumSimilarityScore = Number(process.env.MIN_SIMILARITY_SCORE || 0.72);
const emergencyRules = [
  {
    terms: [
      "심한 복통",
      "복통이 심",
      "복통이 너무",
      "배가 너무 아파",
      "배 너무 아파",
      "배가 많이 아파",
      "배 많이 아파",
      "배가 심하게 아파",
      "사라지지 않는 복통",
      "배에 심한 통증",
    ],
    title: "산모 관련 응급 경고 징후",
    careLevel: "contact_now",
    answer: "배가 아주 아프거나 통증이 계속되면 바로 진료를 받아야 합니다. 아기가 움직여서 그런 것이라고 기다리지 마세요. 지금 산부인과나 응급실에 연락하세요. 통증이 매우 심하거나 이동이 어렵다면 119에 연락하세요.",
  },
  {
    terms: [
      "태동이 줄",
      "태동 줄",
      "태동이 없",
      "태동 없",
      "태동이 멈",
      "태동 멈",
      "태동이 느려",
      "아기가 안 움직",
      "아기가 움직이지",
      "움직임이 줄",
      "움직임이 없",
    ],
    title: "산모 관련 응급 경고 징후",
    careLevel: "contact_now",
    answer: "아기의 움직임이 평소보다 확실히 줄었거나 느껴지지 않으면 바로 산부인과에 연락하세요. 연락이 어렵거나 매우 불안하면 응급실 또는 119의 도움을 받으세요.",
  },
  {
    terms: [
      "출혈",
      "피가 나",
      "피나요",
      "하혈",
      "선홍색 피",
      "양수",
      "물이 새",
      "물 새",
      "물이 터",
      "물 터",
      "양막",
      "규칙적 진통",
      "진통이 규칙",
      "진통이 계속",
      "진통이 점점",
      "진통 간격",
      "일정한 간격",
      "분마다",
      "쉬어도 계속",
      "배뭉침이 규칙",
      "배가 규칙적으로 뭉",
      "배가 계속 뭉치고 아파",
    ],
    title: "조산",
    careLevel: "contact_now",
    answer: "진통이 느껴지거나 배가 계속 뭉치면 담당 산부인과나 분만 병원에 지금 연락하세요. 피가 나거나 물이 새거나 통증이 심하면 바로 응급실로 가거나 119에 연락하세요.",
  },
  {
    terms: [
      "심한 두통",
      "두통이 심",
      "시야",
      "눈앞",
      "눈이 흐",
      "혈압",
      "명치",
      "오른쪽 윗배",
      "상복부",
      "소변량이 줄",
      "소변이 줄",
    ],
    title: "임신고혈압과 전자간증(임신중독증)",
    careLevel: "contact_now",
    answer: "임신 중 머리가 심하게 아프거나, 눈앞이 흐리거나, 윗배가 아프거나, 혈압이 높다면 바로 산부인과 또는 응급실에서 확인받으세요.",
  },
  {
    terms: [
      "숨이 차",
      "숨쉬기 힘",
      "호흡 곤란",
      "가슴 통증",
      "가슴이 아파",
      "심장이 너무 빨",
      "기절",
      "쓰러졌",
      "38도",
      "고열",
      "열이 심",
      "계속 토",
      "토가 멈추지",
      "심하게 토",
      "얼굴이 심하게 붓",
      "손이 심하게 붓",
      "다리가 붓고 아파",
    ],
    title: "산모 관련 응급 경고 징후",
    careLevel: "emergency",
    answer: "숨쉬기 어렵거나 가슴이 아프거나 쓰러질 것 같다면 바로 도움을 받아야 합니다. 지금 산부인과나 응급실에 연락하고, 상태가 급하면 119에 연락하세요.",
  },
  {
    terms: ["자해", "죽고 싶", "죽을래", "살고 싶지", "아기를 해", "아이를 해", "해칠"],
    title: "산후 우울증",
    careLevel: "emergency",
    answer: "자신이나 아이를 해칠 생각이 들면 긴급 상황입니다. 혼자 있지 말고 가까운 사람에게 즉시 알린 뒤 112, 119 또는 가까운 응급실에 도움을 요청하세요.",
  },
];
const medicationTerms = [
  "약 먹",
  "약을 먹",
  "복용",
  "타이레놀",
  "진통제",
  "감기약",
  "항생제",
  "영양제 먹",
];
const abdominalConcernTerms = ["배가 아파", "배 아파", "복통", "배 통증", "아랫배 통증", "배가 당겨"];
const contractionConcernTerms = [
  "진통이 있어",
  "진통 있어",
  "진통이 와",
  "진통 와",
  "진통을 느껴",
  "진통 느껴",
  "진통 시작",
  "진통",
  "진통인데",
  "진통 같",
  "배에 진통",
  "배뭉침",
  "배가 뭉",
  "뭉침",
  "뭉쳐",
  "자궁 수축",
];
const ambiguousMovementTerms = ["움직임이 느껴", "배에서 움직", "배에서 먼가 움직", "움직이는 느낌", "움직이는 느끼", "배가 움직"];
const fetalMovementTerms = [
  "태동",
  "아기가 움직",
  "아기 움직",
  "아이가 움직",
  "아이 움직",
  "애기가 움직",
  "배 속에서 움직",
  "배속에서 움직",
  "꼬물",
  "꼼지락",
  "발로 차",
];
const greetingTerms = ["안녕", "안녕하세요", "ㅎㅇ", "하이", "헬로", "hello", "hi", "반가워"];
const thanksTerms = ["고마워", "고맙", "감사"];
const helpTerms = ["뭘 물어", "무엇을 물어", "어떤 질문", "도와줄", "사용법", "뭐 할 수"];

let knowledgePromise;
let chatModel;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || allowedDevOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("허용되지 않은 웹앱 주소입니다."));
    },
  }),
);
app.use((error, _request, response, next) => {
  if (error instanceof Error && error.message === "허용되지 않은 웹앱 주소입니다.") {
    response.status(403).json({ detail: error.message });
    return;
  }
  next(error);
});
app.use(express.json({ limit: "32kb" }));

async function loadKnowledge() {
  const raw = await readFile(knowledgePath, "utf8");
  return JSON.parse(raw);
}

function toSource(entry) {
  return {
    title: entry.title,
    organization: entry.organization,
    url: entry.url,
    sourceUpdatedAt: entry.sourceUpdatedAt,
    verifiedAt: entry.verifiedAt,
  };
}

const plainLanguageGlossary = [
  ["상한섭취량", "하루에 넘기지 않는 양"],
  ["권장량", "하루에 보통 필요한 양"],
  ["태동", "아기 움직임"],
  ["양수 누출", "물이 새는 느낌"],
  ["전자간증", "임신 중 혈압이 많이 올라 위험해질 수 있는 상태"],
  ["리스테리아", "식중독균의 한 종류"],
  ["Tdap", "백일해 예방 주사"],
  ["RSV", "호흡기 바이러스"],
  ["mcg", "아주 작은 양을 나타내는 단위"],
  ["IU", "비타민 양을 나타내는 단위"],
];

function addPlainLanguageGlossary(answer) {
  const explanations = plainLanguageGlossary
    .filter(([term]) => answer.includes(term))
    .slice(0, 3)
    .map(([term, meaning]) => `${term}: ${meaning}`);

  if (explanations.length === 0) return answer;

  return `${answer}\n\n말 풀이: ${explanations.join(" / ")}`;
}

function officialExtractAnswer(entries) {
  const extracts = entries
    .map((entry) => {
      return entry.plainAnswer || entry.evidence;
    })
    .join("\n\n");

  return addPlainLanguageGlossary(
    `쉽게 말하면,\n${extracts}\n\n사람마다 임신 주수와 몸 상태가 다를 수 있습니다. 숫자나 복용량이 헷갈리면 산전 진료 때 성분표를 보여주고 확인하세요.`,
  );
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[\s.,!?~"'`()\-_/]/g, "");
}

function includesTerm(message, term) {
  return normalizeText(message).includes(normalizeText(term));
}

function getChatModel() {
  if (!chatModel) {
    chatModel = new ChatOpenAI({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      maxRetries: 2,
    });
  }
  return chatModel;
}

async function findCareRouting(question) {
  const rule = emergencyRules.find(({ terms }) =>
    terms.some((term) => includesTerm(question, term)),
  );
  if (!rule) return null;

  const documents = await loadKnowledge();
  const source = documents.find((entry) => entry.title === rule.title);
  return {
    answer: rule.answer,
    urgent: rule.careLevel === "emergency",
    careLevel: rule.careLevel,
    sources: source ? [toSource(source)] : [],
    responseMode: `${rule.careLevel}_guidance`,
  };
}

function findSafetyBoundary(message) {
  if (!medicationTerms.some((term) => includesTerm(message, term))) return null;

  return {
    answer: "임신 중 약이나 영양제를 먹어도 되는지는 약 이름과 임신 주수에 따라 다릅니다. 이 챗봇이 복용 여부를 정해드릴 수는 없습니다.\n\n먹기 전에는 약 이름과 용량을 확인해 산부인과나 약사에게 문의하세요. 이미 먹었고 몸에 이상이 있다면 바로 의료기관에 연락하세요.",
    urgent: false,
    careLevel: "information",
    sources: [],
    responseMode: "medication_safety_boundary",
  };
}

async function findClarifyingQuestion(message) {
  const documents = await loadKnowledge();

  if (
    ambiguousMovementTerms.some((term) => includesTerm(message, term)) &&
    !fetalMovementTerms.some((term) => includesTerm(message, term))
  ) {
    return {
      answer: "말씀하신 `움직임`이 어떤 느낌인지 조금 더 알려주세요.\n\n1. 아기가 움직이는 느낌인가요?\n2. 배가 단단해지거나 뭉치는 느낌인가요?\n3. 아프거나 일정한 간격으로 반복되는 느낌인가요?\n\n피가 보이거나 물이 새는 느낌, 심한 통증, 아기 움직임이 줄어든 경우라면 답변을 기다리지 말고 산부인과에 바로 연락하세요.",
      urgent: false,
      careLevel: "clarify",
      sources: [],
      responseMode: "clarifying_question",
    };
  }

  if (contractionConcernTerms.some((term) => includesTerm(message, term))) {
    const source = documents.find((entry) => entry.title === "조산");
    return {
      answer: "진통이나 배뭉침처럼 느껴지시는군요. 상태를 구분하려면 아래 내용을 알려주세요.\n\n1. 현재 임신 몇 주인가요?\n2. 배가 뭉치거나 아픈 느낌이 일정한 간격으로 반복되나요?\n3. 쉬거나 자세를 바꿔도 계속되거나 더 강해지나요?\n4. 피가 보이거나 물이 새는 느낌이 있나요?\n\n규칙적으로 반복되거나 점점 강해지거나, 피 또는 물이 보이면 지금 산부인과나 분만 병원에 연락하세요.",
      urgent: false,
      careLevel: "clarify",
      sources: source ? [toSource(source)] : [],
      responseMode: "contraction_clarifying_question",
    };
  }

  return null;
}

async function findContextualReply(message, history) {
  const lastAssistant = [...history]
    .reverse()
    .find((entry) => entry.role === "assistant" && typeof entry.responseMode === "string");
  if (!lastAssistant) return null;

  if (lastAssistant.responseMode === "clarifying_question") {
    if (
      ["1번", "일번", "첫 번째", "첫번째"].some((term) => includesTerm(message, term)) ||
      fetalMovementTerms.some((term) => includesTerm(message, term))
    ) {
      return findFetalMovementGuidance("태동");
    }
    if (
      ["2번", "이번", "두 번째", "두번째", "단단한", "단단해", "조이는"].some((term) =>
        includesTerm(message, term),
      ) ||
      contractionConcernTerms.some((term) => includesTerm(message, term))
    ) {
      return findClarifyingQuestion("배뭉침");
    }
    if (
      ["3번", "삼번", "세 번째", "세번째", "아픈 느낌", "통증"].some((term) =>
        includesTerm(message, term),
      )
    ) {
      return findSymptomGuidance("배가 아파");
    }
  }

  if (lastAssistant.responseMode === "contraction_clarifying_question") {
    const source = (await loadKnowledge()).find((entry) => entry.title === "조산");
    return {
      answer: "알려주셔서 감사합니다. 채팅만으로 가진통인지 진통인지 정확히 구분할 수는 없습니다.\n\n배뭉침이나 통증이 일정하게 반복되거나 점점 강해지거나, 피 또는 물이 보이면 지금 산부인과나 분만 병원에 연락하세요. 증상이 가라앉았더라도 다시 반복되거나 걱정되면 담당 산부인과에 확인하세요.",
      urgent: false,
      careLevel: "clarify",
      sources: source ? [toSource(source)] : [],
      responseMode: "contraction_follow_up",
    };
  }

  return null;
}

async function findSymptomGuidance(message) {
  if (!abdominalConcernTerms.some((term) => includesTerm(message, term))) return null;

  const documents = await loadKnowledge();
  const source = documents.find((entry) => entry.title === "산모 관련 응급 경고 징후");
  return {
    answer: "배가 아프시군요. 상태를 더 확인할게요.\n\n1. 통증이 많이 심하거나 계속되나요?\n2. 일정한 간격으로 반복되거나 점점 강해지나요?\n3. 피가 보이거나 물이 새는 느낌이 있나요?\n4. 평소보다 아기 움직임이 줄었나요?\n\n위 항목 중 하나라도 해당되면 지금 담당 산부인과나 응급실에 연락하세요.",
    urgent: false,
    careLevel: "clarify",
    sources: source ? [toSource(source)] : [],
    responseMode: "symptom_safety_guidance",
  };
}

function findFetalMovementGuidance(message) {
  if (!fetalMovementTerms.some((term) => includesTerm(message, term))) return null;

  return {
    answer: "아기가 움직이는 느낌을 말씀하시는 것이라면 태동일 수 있습니다. 움직임이 느껴진다는 것만으로 위험한 상태라고 판단하지 않습니다.\n\n혹시 평소보다 아기 움직임이 줄었거나, 통증 또는 피가 함께 보이나요? 그런 경우에는 바로 담당 산부인과에 연락하세요.",
    urgent: false,
    careLevel: "information",
    sources: [],
    responseMode: "fetal_movement_guidance",
  };
}

function findConversationReply(message) {
  if (greetingTerms.some((term) => includesTerm(message, term))) {
    return {
      answer: "안녕하세요. 임신 중 궁금한 건강정보를 공식 자료에 근거해 안내하는 챗봇입니다.\n\n예를 들어 `배에 진통이 있어요`, `태동이 줄었어요`, `출혈이 있어요`, `임신당뇨 검사는 언제 하나요?`, `엽산은 왜 필요한가요?`처럼 말씀해 주세요.\n\n출혈, 양수 누출, 심한 통증, 태동 감소처럼 급한 증상이 있으면 챗봇 답변을 기다리지 말고 산부인과 또는 응급실에 연락하세요.",
      urgent: false,
      careLevel: "information",
      sources: [],
      responseMode: "greeting",
    };
  }

  if (helpTerms.some((term) => includesTerm(message, term))) {
    return {
      answer: "저는 공식 자료가 있는 임신 건강정보를 안내하고, 위험 증상 표현이 들어오면 즉시 진료 안내를 드립니다.\n\n질문 예시: `진통이 있는 것 같아요`, `물이 새는 것 같아요`, `눈앞이 흐리고 머리가 아파요`, `태동이 줄었어요`, `임신당뇨 검사는 언제 해요?`, `엽산이 필요한가요?`\n\n진단이나 처방, 약 복용 결정은 의료진에게 확인해야 합니다.",
      urgent: false,
      careLevel: "information",
      sources: [],
      responseMode: "help",
    };
  }

  if (thanksTerms.some((term) => includesTerm(message, term))) {
    return {
      answer: "도움이 되었다면 다행입니다. 불편한 증상이 있거나 걱정되는 변화가 생기면 구체적으로 말씀해 주세요. 출혈, 양수 누출, 심한 통증, 태동 감소 등은 바로 의료기관에 연락해야 합니다.",
      urgent: false,
      careLevel: "information",
      sources: [],
      responseMode: "courtesy",
    };
  }

  return null;
}

async function getKnowledgeStore() {
  if (!knowledgePromise) {
    knowledgePromise = (async () => {
      const knowledge = await loadKnowledge();
      const embeddings = new OpenAIEmbeddings({
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      });
      return MemoryVectorStore.fromDocuments(
        knowledge.map((entry) => ({
          pageContent: `${entry.topic}\n${entry.evidence}`,
          metadata: {
            title: entry.title,
            organization: entry.organization,
            url: entry.url,
            topic: entry.topic,
            evidence: entry.evidence,
            sourceUpdatedAt: entry.sourceUpdatedAt,
            verifiedAt: entry.verifiedAt,
          },
        })),
        embeddings,
      );
    })();
  }
  return knowledgePromise;
}

function localVerifiedSearch(message, knowledge) {
  const normalized = message.replace(/\s+/g, "").toLowerCase();
  const weakKeywords = new Set(["임신", "임산부", "증상", "초기", "중", "몇주"]);
  const shortStrongKeywords = new Set(["술", "냉", "회", "쥐"]);
  const scored = knowledge
    .map((entry) => {
      const matchedKeywords = entry.topic
        .split(/\s+/)
        .filter((keyword) => {
          const normalizedKeyword = keyword.toLowerCase();
          return (
            (normalizedKeyword.length >= 2 || shortStrongKeywords.has(normalizedKeyword)) &&
            normalized.includes(normalizedKeyword)
          );
        });
      const strongMatches = matchedKeywords.filter((keyword) => !weakKeywords.has(keyword));
      const score = strongMatches.reduce(
        (sum, keyword) => sum + (shortStrongKeywords.has(keyword) ? 2 : Math.max(1, keyword.length)),
        0,
      );

      return {
        entry,
        score,
        strongMatchCount: strongMatches.length,
      };
    })
    .filter(({ score, strongMatchCount }) => score >= 2 && strongMatchCount > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2);

  if (scored.length > 1 && scored[1].score < scored[0].score * 0.7) {
    return [scored[0].entry];
  }

  return scored
    .map(({ entry }) => entry);
}

async function findKnowledgeMatches(message) {
  const knowledge = await loadKnowledge();
  const localMatches = localVerifiedSearch(message, knowledge);
  if (localMatches.length > 0) return localMatches;

  if (!semanticRetrievalEnabled) return [];

  const store = await getKnowledgeStore();
  const documents = await store.similaritySearchWithScore(message, 2);
  return documents
    .filter(([, score]) => score >= minimumSimilarityScore)
    .map(([document]) => document.metadata);
}

function getGeneratedContent(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (typeof part === "string" ? part : part?.text || ""))
    .join("")
    .trim();
}

async function generateAiReply(message, history) {
  const matches = await findKnowledgeMatches(message);
  const evidence = matches.length
    ? matches
        .map(
          (entry) =>
            `[${entry.organization} - ${entry.title}]\n공식 근거: ${entry.evidence}\n쉬운 안내 참고: ${entry.plainAnswer || entry.evidence}`,
        )
        .join("\n\n")
    : "현재 등록된 공식 자료에서 이 질문에 직접 연결되는 근거를 찾지 못했습니다.";
  const previousMessages = history
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: entry.text.slice(0, 1000),
    }));
  const systemPrompt = `당신은 임산부와 보호자를 위한 건강정보 상담 챗봇입니다.
읽는 사람은 의학 지식이 없는 임산부 또는 보호자입니다. 초등 고학년~중학생도 이해할 수 있는 쉬운 한국어로 답하세요.

답변 방식:
- 첫 문장은 결론부터 말하세요. 예: "하루 총량을 200 mg 아래로 보는 것이 좋아요."
- 그 다음 2~4문장으로 이유와 조심할 점을 짧게 설명하세요.
- 질문이 모호하면 답을 단정하지 말고 확인 질문을 먼저 하세요.
- 전문용어는 가능한 쓰지 마세요.
- 꼭 필요한 전문용어는 바로 쉬운 말로 풀어 쓰세요. 예: "태동(아기 움직임)", "양수 누출(물이 새는 느낌)", "상한섭취량(하루에 넘기지 않는 양)".
- "근거에 따르면", "합병증", "전자간증", "감별", "상한섭취량"처럼 딱딱한 표현을 답변 앞쪽에 두지 마세요.
- 사용자를 겁주지 마세요. 위험 신호가 명확할 때만 분명하게 병원 연락을 안내하세요.

안전 규칙:
- 사용자가 모호하게 말하면 즉시 위험하다고 단정하지 말고 먼저 필요한 확인 질문을 1~3개 하세요.
- 제공된 공식 근거에 없는 의학 사실, 진단, 약 복용 결정, 치료 방법을 만들어내지 마세요.
- 공식 근거가 없으면 일반 대화는 자연스럽게 응답할 수 있지만 의료 판단은 하지 말고 필요한 추가 질문 또는 의료진 확인을 안내하세요.
- 출혈, 물이 새는 느낌, 평소보다 줄어든 태동, 심하거나 지속되는 통증 등 사용자가 명확히 말하면 산부인과에 연락하도록 분명히 안내하세요.
- 호흡 곤란, 흉통, 실신, 자해 또는 아이를 해칠 생각이면 응급실·119·112 등 즉각적 도움을 안내하세요.
- 답변은 짧은 문단 위주로 작성하고, URL이나 출처 목록은 쓰지 마세요. 출처는 화면에서 별도로 표시됩니다.

이 질문과 관련해 검색된 공식 자료:
${evidence}`;
  const modelResponse = await getChatModel().invoke([
    { role: "system", content: systemPrompt },
    ...previousMessages,
    { role: "user", content: message },
  ]);
  const answer = getGeneratedContent(modelResponse.content);
  if (!answer) throw new Error("AI 답변을 생성하지 못했습니다.");

  return {
    answer,
    urgent: false,
    careLevel: "information",
    sources: matches.map(toSource),
    responseMode: matches.length > 0 ? "ai_grounded_response" : "ai_conversation",
  };
}

async function retrieveVerifiedKnowledge(message) {
  const matches = await findKnowledgeMatches(message);

  if (matches.length === 0) {
    return {
      answer: "질문과 직접 연결되는 공식 자료를 현재 등록된 범위에서 찾지 못했습니다. 임신 주수와 궁금한 증상 또는 항목을 조금 더 구체적으로 적어 주세요.\n\n예: `배에 진통이 있어요`, `태동이 줄었어요`, `출혈이 있어요`, `임신당뇨 검사는 언제 하나요?`\n\n심한 통증, 출혈, 양수 누출, 태동 감소 등 걱정되는 증상이 있으면 챗봇 답변을 기다리지 말고 산부인과 또는 응급실에 연락하세요.",
      urgent: false,
      careLevel: "information",
      sources: [],
      responseMode: "no_verified_match",
    };
  }
  return {
    answer: officialExtractAnswer(matches),
    urgent: false,
    careLevel: "information",
    sources: matches.map(toSource),
    responseMode: "verified_plain_language",
  };
}

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    aiGenerationConfigured: aiGenerationEnabled,
    chatModel: aiGenerationEnabled ? process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini" : null,
    semanticRetrievalConfigured: semanticRetrievalEnabled,
    host,
    answerPolicy: aiGenerationEnabled ? "guarded_rag_generation" : "verified_source_plain_language",
    service: "AI_Chat",
    knowledgeSource: "trusted-knowledge.json",
    verifiedAt: "2026-05-27",
  });
});

app.post("/api/chat", async (request, response) => {
  const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";
  const history = Array.isArray(request.body?.history)
    ? request.body.history.filter(
        (entry) =>
          entry &&
          (entry.role === "user" || entry.role === "assistant") &&
          typeof entry.text === "string",
      )
    : [];

  if (!message) {
    response.status(400).json({ detail: "질문을 입력해주세요." });
    return;
  }

  try {
    const urgentReply = await findCareRouting(message);
    const result =
      urgentReply ||
      findSafetyBoundary(message) ||
      (await findContextualReply(message, history)) ||
      (await findClarifyingQuestion(message)) ||
      (await findSymptomGuidance(message)) ||
      findFetalMovementGuidance(message) ||
      (aiGenerationEnabled
        ? await generateAiReply(message, history)
        :
          findConversationReply(message) ||
          (await retrieveVerifiedKnowledge(message)));
    response.json({
      ...result,
      disclaimer: "이 안내는 의료진 진료를 대체하지 않습니다.",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "상담 처리 중 오류가 발생했습니다.";
    response.status(503).json({ detail });
  }
});

const server = app.listen(port, host, () => {
  console.log(`AI_Chat API listening on http://${host}:${port}`);
});

export { app, server };
