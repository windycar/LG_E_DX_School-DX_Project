from __future__ import annotations

import csv
import json
import random
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"

LABELS = ["행복", "안정", "설렘", "중립", "불안", "피로", "우울", "화남"]

DESCRIPTIONS = {
    "행복": "즐거움, 만족, 감사, 성취감처럼 긍정적이고 밝은 정서",
    "안정": "편안함, 안도감, 차분함, 평온함처럼 마음이 안정된 정서",
    "설렘": "기대, 두근거림, 신남, 새로운 가능성에 대한 긍정적 긴장감",
    "중립": "큰 감정 변화 없이 평범하고 차분한 상태",
    "불안": "걱정, 두려움, 초조, 긴장처럼 미래 위험을 예상하는 정서",
    "피로": "지침, 무기력, 번아웃, 체력 저하처럼 에너지가 고갈된 상태",
    "우울": "슬픔, 외로움, 실망, 후회처럼 가라앉고 무거운 정서",
    "화남": "화, 짜증, 억울함, 답답함처럼 격한 불쾌감이 올라온 정서",
}

SYNTHETIC_SEEDS = {
    "행복": [
        "오늘은 생각보다 일이 잘 풀려서 기분이 좋았다",
        "작은 성취였지만 스스로가 자랑스러웠다",
        "좋은 소식을 듣고 하루 종일 웃음이 났다",
        "내 노력이 인정받은 것 같아 마음이 밝아졌다",
    ],
    "안정": [
        "오랜만에 마음이 편안하고 차분했다",
        "큰 문제 없이 하루가 지나가서 안도감이 들었다",
        "조용히 산책하고 나니 마음이 안정됐다",
        "해야 할 일을 정리하고 나니 숨이 조금 놓였다",
    ],
    "설렘": [
        "새로운 일을 앞두고 기대감 때문에 마음이 두근거렸다",
        "내일 만날 생각을 하니 괜히 설레고 기분이 들떴다",
        "처음 해보는 도전이라 긴장되지만 기대가 더 컸다",
        "좋은 변화가 생길 것 같아서 하루 종일 마음이 들떴다",
    ],
    "중립": [
        "오늘은 특별한 일 없이 평소처럼 시간이 지나갔다",
        "해야 할 일을 정리하고 조용히 하루를 마무리했다",
        "큰 감정 변화 없이 무난한 하루를 보냈다",
        "일정을 확인하고 필요한 일만 처리했다",
    ],
    "불안": [
        "앞으로 어떻게 될지 몰라 계속 걱정됐다",
        "실수할까 봐 마음이 초조하고 긴장됐다",
        "해야 할 일이 많아서 어디서부터 시작해야 할지 막막했다",
        "괜찮을 거라고 생각해도 걱정이 쉽게 사라지지 않았다",
    ],
    "피로": [
        "하루 종일 몸이 무겁고 아무것도 하고 싶지 않았다",
        "계속되는 일 때문에 지치고 에너지가 바닥난 느낌이었다",
        "잠을 자도 피곤이 풀리지 않아 무기력했다",
        "해야 할 일은 많은데 몸과 마음이 따라주지 않았다",
    ],
    "우울": [
        "괜찮은 척했지만 마음이 계속 가라앉았다",
        "사람들 사이에 있어도 혼자인 것 같은 기분이 들었다",
        "별일 아닌데도 마음이 무겁고 눈물이 날 것 같았다",
        "후회와 실망이 계속 남아 하루가 길게 느껴졌다",
    ],
    "화남": [
        "사소한 말 하나에도 짜증이 올라와 참기 어려웠다",
        "내 노력을 당연하게 여기는 것 같아 화가 났다",
        "억울한 생각이 들어서 마음이 쉽게 가라앉지 않았다",
        "상대의 태도가 무례해서 하루 종일 신경질이 났다",
    ],
}

CLOSINGS = {
    "행복": ["이 기분을 오래 기억하고 싶다.", "이런 날이 자주 있었으면 좋겠다."],
    "안정": ["오늘은 이 평온함을 지키고 싶다.", "차분하게 마무리할 수 있어서 다행이다."],
    "설렘": ["좋은 방향으로 이어졌으면 좋겠다.", "기대되는 마음을 잘 간직하고 싶다."],
    "중립": ["그냥 평범한 하루였다고 느꼈다.", "특별히 기억에 남는 감정은 없었다."],
    "불안": ["일단 할 수 있는 것부터 정리해야겠다.", "차분해지려고 해도 걱정이 쉽게 줄지 않았다."],
    "피로": ["오늘은 무리하지 않고 쉬어야겠다.", "잠깐 멈추고 회복할 시간이 필요하다."],
    "우울": ["내일은 조금이라도 나아졌으면 좋겠다.", "오늘은 버티는 것만으로도 힘들었다."],
    "화남": ["이 감정을 정리할 시간이 필요하다.", "그냥 넘기기에는 마음이 너무 거칠었다."],
}

STABLE_KEYWORDS = [
    "편안",
    "안도",
    "느긋",
    "차분",
    "평온",
    "신뢰",
    "걱정 없이",
    "마음 편",
    "가벼워졌다",
    "재택",
    "휴식",
]
EXCITED_KEYWORDS = [
    "설레",
    "기대",
    "두근",
    "신나",
    "흥분",
    "프러포즈",
    "합격",
    "취업",
    "생일",
    "서프라이즈",
    "새로운",
    "도전",
]
FATIGUE_KEYWORDS = [
    "피곤",
    "지친",
    "지치",
    "무기력",
    "기운이 빠",
    "번아웃",
    "잠이",
    "힘드",
    "몸이 무겁",
    "에너지",
    "쉬고 싶",
]


def contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def remap_label(row: dict[str, str]) -> str:
    old_label = row["main_emotion"]
    text = f"{row.get('text', '')} {row.get('sub_emotion', '')} {row.get('situation', '')}"

    if old_label == "기쁨":
        if contains_any(text, EXCITED_KEYWORDS):
            return "설렘"
        if contains_any(text, STABLE_KEYWORDS):
            return "안정"
        return "행복"
    if old_label == "슬픔":
        return "피로" if contains_any(text, FATIGUE_KEYWORDS) else "우울"
    if old_label == "분노":
        return "화남"
    if old_label == "불안":
        return "불안"
    if old_label == "상처":
        return "피로" if contains_any(text, FATIGUE_KEYWORDS) else "우울"
    if old_label == "당황":
        return "불안"
    if old_label == "중립":
        return "중립"
    return old_label


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, records: list[dict[str, str]]) -> None:
    fieldnames = ["text", "main_emotion", "sub_emotion", "situation", "source"]
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def synthetic_records(label: str, count: int, source_name: str, seed_offset: int) -> list[dict[str, str]]:
    rng = random.Random(20260528 + seed_offset + len(label))
    records = []
    for _ in range(count):
        first = rng.choice(SYNTHETIC_SEEDS[label])
        second = rng.choice(SYNTHETIC_SEEDS[label])
        closing = rng.choice(CLOSINGS[label])
        text = f"{first}. {closing}" if first == second else f"{first}. {second}. {closing}"
        records.append(
            {
                "text": text,
                "main_emotion": label,
                "sub_emotion": "합성",
                "situation": "다이어리",
                "source": source_name,
            }
        )
    return records


def convert_dataset(file_name: str, target_per_label: int, source_name: str) -> tuple[Counter, int]:
    records = read_csv(PROCESSED_DIR / file_name)
    for row in records:
        row["main_emotion"] = remap_label(row)
        if row["sub_emotion"] in {"기쁨", "슬픔", "분노", "상처", "당황"}:
            row["sub_emotion"] = row["main_emotion"]

    counts = Counter(row["main_emotion"] for row in records)
    for label in LABELS:
        need = max(0, target_per_label - counts[label])
        if need:
            records.extend(synthetic_records(label, need, source_name, target_per_label))

    random.Random(42).shuffle(records)
    write_csv(PROCESSED_DIR / file_name, records)
    return Counter(row["main_emotion"] for row in records), len(records)


def main() -> None:
    train_distribution, train_total = convert_dataset(
        "diary_emotion_train.csv", 3200, "synthetic_project_label_train"
    )
    validation_distribution, validation_total = convert_dataset(
        "diary_emotion_validation.csv", 350, "synthetic_project_label_validation"
    )

    label_map = {"labels": LABELS, "description": DESCRIPTIONS}
    (PROCESSED_DIR / "label_map.json").write_text(
        json.dumps(label_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    summary = {
        "train_total": train_total,
        "validation_total": validation_total,
        "train_distribution": dict(train_distribution),
        "validation_distribution": dict(validation_distribution),
        "notes": [
            "프로젝트 감정 대분류를 행복, 안정, 설렘, 중립, 불안, 피로, 우울, 화남 8개로 재구성했습니다.",
            "기존 7개 라벨 데이터는 새 라벨 체계로 매핑했고 부족한 라벨은 합성 다이어리 문장으로 보강했습니다.",
            "실제 사용자 다이어리 적용 전 샘플 검수와 추가 데이터 보강이 필요합니다.",
        ],
    }
    (PROCESSED_DIR / "dataset_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
