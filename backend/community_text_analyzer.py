from collections import Counter
import re


DEFAULT_STOPWORDS = {
    "오늘", "저는", "제가", "너무", "진짜", "그냥", "이제", "요즘", "조금",
    "많이", "정말", "같아요", "있어요", "없어요", "합니다", "해서", "그리고",
    "근데", "혹시", "우리", "임신", "임산부", "아기", "때문", "관련",
}


def tokenize_korean_text(text: str):
    try:
        from kiwipiepy import Kiwi

        kiwi = Kiwi()
        tokens = []
        for token in kiwi.tokenize(text):
            if token.tag.startswith(("N", "V", "VA", "XR")):
                tokens.append(token.form)
        return tokens
    except Exception:
        return re.findall(r"[가-힣A-Za-z0-9]{2,}", text)


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

    positive_words = {"좋", "행복", "감사", "기대", "편안", "괜찮", "축하", "도움"}
    negative_words = {"불안", "힘들", "아프", "걱정", "무섭", "우울", "피곤", "통증"}
    positive_score = sum(count for word, count in counts.items() if any(key in word for key in positive_words))
    negative_score = sum(count for word, count in counts.items() if any(key in word for key in negative_words))
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
