from __future__ import annotations

import json
import math
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "diary_emotion_nb_model.json"
LABEL_MAP_PATH = ROOT / "data" / "processed" / "label_map.json"
CONTRAST_MARKERS = ["근데", "그런데", "하지만", "그래도", "다만", "결국", "이후에는", "그러다"]
LEXICON_BOOSTS = {
    "행복": [
        "행복",
        "기쁘",
        "기분 좋",
        "좋았",
        "좋더",
        "좋아",
        "맛있",
        "만족",
        "뿌듯",
        "감사",
        "고마",
        "웃음",
        "즐거",
    ],
    "안정": ["안정", "안심", "안도", "편안", "차분", "괜찮", "다행", "마음이 놓"],
    "설렘": ["설레", "설렜", "두근", "기대", "기다려", "신기", "얼른 보고", "태어날 생각"],
    "중립": ["평범", "무난", "특별한 일 없이", "큰 감정 변화"],
    "불안": ["불안", "걱정", "초조", "두려", "무섭", "괜찮을까", "문제가 있을까", "어떡"],
    "피로": ["피곤", "피로", "지쳐", "지친", "지치", "힘들", "무기력", "몸이 무거", "잠도 잘 못"],
    "우울": ["우울", "슬프", "서럽", "눈물", "울고", "외롭", "속상", "상처", "가라앉"],
    "화남": ["화가", "화나", "짜증", "분노", "억울", "열받", "싸워", "욕"],
}


def normalize(text: str) -> str:
    return " ".join(text.strip().lower().split())


def extract_features(text: str) -> Counter:
    text = normalize(text)
    compact = text.replace(" ", "")
    features = Counter()

    for token in text.split():
        if len(token) >= 2:
            features[f"w:{token}"] += 1

    for n in (2, 3):
        if len(compact) >= n:
            for i in range(len(compact) - n + 1):
                features[f"c{n}:{compact[i:i+n]}"] += 1

    return features


def find_contrast_tail(text: str) -> str:
    positions = [(text.rfind(marker), marker) for marker in CONTRAST_MARKERS]
    position, marker = max(positions, key=lambda item: item[0])
    if position < 0:
        return ""
    tail = text[position + len(marker):].strip(" ,.!?~")
    return tail if len(tail) >= 4 else ""


def score_text(model: dict, text: str) -> dict[str, float]:
    vocabulary = set(model["vocabulary"])
    features = extract_features(text)
    scores = {}

    for label in model["labels"]:
        score = model["priors"][label]
        evidence = 0.0
        evidence_count = 0
        feature_counts = model["feature_counts"][label]
        denominator = model["feature_totals"][label] + len(vocabulary)
        for feature, count in features.items():
            if feature in vocabulary:
                evidence += math.log((feature_counts.get(feature, 0) + 1) / denominator) * count
                evidence_count += count
        if evidence_count:
            score += evidence / evidence_count
        scores[label] = score

    return scores


def scores_to_probabilities(scores: dict[str, float]) -> dict[str, float]:
    max_score = max(scores.values())
    exp_scores = {label: math.exp(score - max_score) for label, score in scores.items()}
    total = sum(exp_scores.values())
    return {label: value / total for label, value in exp_scores.items()}


def apply_lexicon_boost(scores: dict[str, float], text: str, weight: float) -> dict[str, float]:
    boosted = dict(scores)
    for label, keywords in LEXICON_BOOSTS.items():
        boost = sum(1 for keyword in keywords if keyword in text)
        if boost:
            boosted[label] += boost * weight
    return boosted


def apply_short_daily_guard(scores: dict[str, float], text: str) -> dict[str, float]:
    positive_food_words = ["맛있", "맛나", "든든", "잘 먹", "먹고 기분", "먹었는데 좋"]
    daily_words = ["먹었다", "먹었", "마셨", "산책", "쉬었다", "잤다", "봤다", "했다"]
    negative_words = ["화", "짜증", "억울", "불안", "걱정", "우울", "슬프", "힘들", "피곤", "아프"]

    boosted = dict(scores)
    if any(word in text for word in positive_food_words):
        boosted["행복"] += 1.4
        boosted["화남"] -= 0.8
        boosted["우울"] -= 0.5
        boosted["불안"] -= 0.5
    elif any(word in text for word in daily_words) and not any(word in text for word in negative_words):
        boosted["중립"] += 0.55
        boosted["화남"] -= 0.35
    return boosted


def predict(model: dict, text: str) -> tuple[str, dict[str, float]]:
    scores = score_text(model, text)
    scores = apply_lexicon_boost(scores, text, 0.45)
    scores = apply_short_daily_guard(scores, text)
    tail = find_contrast_tail(text)
    if tail:
        tail_scores = score_text(model, tail)
        tail_scores = apply_lexicon_boost(tail_scores, tail, 0.75)
        tail_scores = apply_short_daily_guard(tail_scores, tail)
        scores = {
            label: (scores[label] * 0.35) + (tail_scores[label] * 0.65)
            for label in model["labels"]
        }

    probabilities = scores_to_probabilities(scores)
    prediction = max(probabilities, key=probabilities.get)
    return prediction, probabilities


def main() -> None:
    if len(sys.argv) < 2:
        diary_text = input("다이어리 문장을 입력하세요: ").strip()
        if not diary_text:
            print("입력된 문장이 없습니다.")
            raise SystemExit(1)
    else:
        diary_text = " ".join(sys.argv[1:])

    model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    label_map = json.loads(LABEL_MAP_PATH.read_text(encoding="utf-8"))
    prediction, probabilities = predict(model, diary_text)
    sorted_probabilities = sorted(probabilities.items(), key=lambda item: item[1], reverse=True)

    result = {
        "input": diary_text,
        "main_emotion": prediction,
        "confidence": round(probabilities[prediction], 4),
        "description": label_map["description"].get(prediction, ""),
        "ranking": [
            {"emotion": label, "probability": round(probability, 4)}
            for label, probability in sorted_probabilities
        ],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
