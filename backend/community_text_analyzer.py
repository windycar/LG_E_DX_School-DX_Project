from collections import Counter
import re


DEFAULT_STOPWORDS = {
    "오늘", "정말", "진짜", "그냥", "이제", "조금", "많이", "우리", "임신", "임산부", "아기",
    "때문", "관련", "그리고", "근데", "다시", "합니다", "있어요", "없어요",
}

POSITIVE_WORDS = {"좋", "행복", "감사", "기쁨", "편안", "괜찮", "축하", "다행", "고마"}
NEGATIVE_WORDS = {"불안", "힘들", "아프", "걱정", "무섭", "우울", "짜증", "통증", "화남"}


def tokenize_korean_text(text: str):
    # Render Free memory guard: avoid loading Kiwi by default.
    return re.findall(r"[가-힣A-Za-z0-9]{2,}", text or "")


def analyze_community_text(texts, stopwords=None, limit=40):
    stopword_set = set(DEFAULT_STOPWORDS)
    stopword_set.update(word.strip() for word in (stopwords or []) if word and word.strip())

    joined = "\n".join(text for text in texts if text)
    tokens = [
        token.strip()
        for token in tokenize_korean_text(joined)
        if len(token.strip()) >= 2 and token.strip() not in stopword_set
    ]
    counts = Counter(tokens)
    top_words = [{"word": word, "count": count} for word, count in counts.most_common(limit)]

    positive_score = sum(count for word, count in counts.items() if any(key in word for key in POSITIVE_WORDS))
    negative_score = sum(count for word, count in counts.items() if any(key in word for key in NEGATIVE_WORDS))
    neutral_score = max(0, len(tokens) - positive_score - negative_score)

    return {
        "total_documents": len([text for text in texts if text]),
        "total_tokens": len(tokens),
        "top_words": top_words,
        "sentiment_hint": [
            {"label": "긍정", "count": positive_score},
            {"label": "중립", "count": neutral_score},
            {"label": "불안/불편", "count": negative_score},
        ],
        "used_stopwords": sorted(stopword_set),
    }
