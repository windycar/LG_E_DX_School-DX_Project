# backend/ai_service.py
import json
import math
from collections import Counter
from pathlib import Path

# 1. 파일 경로 설정 (backend 폴더를 기준으로 자체 AI 모델 경로 추적)
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "diary_emotion_ai" / "models" / "diary_emotion_nb_model.json"
LABEL_MAP_PATH = BASE_DIR / "diary_emotion_ai" / "data" / "processed" / "label_map.json"

# 2. 서버 구동 시 AI 모델을 메모리에 1회 적재 (싱글톤 패턴)
print("자체 AI 모델을 메모리에 적재 중입니다...")
_model = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
_label_map = json.loads(LABEL_MAP_PATH.read_text(encoding="utf-8"))
print("AI 모델 적재 완료.")

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

# 3. 감정 분석 추론(Inference) 함수
def analyze_emotion(text: str) -> dict:
    vocabulary = set(_model["vocabulary"])
    features = extract_features(text)
    scores = {}

    for label in _model["labels"]:
        score = _model["priors"][label]
        evidence = 0.0
        evidence_count = 0
        feature_counts = _model["feature_counts"][label]
        denominator = _model["feature_totals"][label] + len(vocabulary)
        
        for feature, count in features.items():
            if feature in vocabulary:
                evidence += math.log((feature_counts.get(feature, 0) + 1) / denominator) * count
                evidence_count += count
        
        if evidence_count:
            score += evidence / evidence_count
        scores[label] = score

    max_score = max(scores.values())
    exp_scores = {label: math.exp(score - max_score) for label, score in scores.items()}
    total = sum(exp_scores.values())
    probabilities = {label: value / total for label, value in exp_scores.items()}
    prediction = max(probabilities, key=probabilities.get)

    return {
        "main_emotion": prediction,
        "confidence": round(probabilities[prediction], 4),
        "description": _label_map["description"].get(prediction, "")
    }