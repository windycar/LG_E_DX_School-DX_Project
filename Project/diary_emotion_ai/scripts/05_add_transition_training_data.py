from __future__ import annotations

import csv
import json
import random
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"

FIELDNAMES = ["text", "main_emotion", "sub_emotion", "situation", "source"]
TRANSITION_SOURCES = {
    "synthetic_transition_train",
    "synthetic_transition_validation",
}

TRANSITION_CASES = {
    "행복": [
        (
            "오늘 비가 와서 우울했어. 근데 우울해서 빵 사고 빵 먹고 남편 얼굴 보니까 "
            "기분이 좋고 행복했어."
        ),
        "아침에는 괜히 마음이 가라앉았는데, 그래도 친구랑 웃으면서 이야기하니 행복했다.",
        "처음엔 실망스러웠지만 맛있는 걸 먹고 가족을 보니 기분이 좋아졌다.",
        "하루 초반에는 우울했는데 결국 좋은 소식을 듣고 행복한 마음으로 끝났다.",
    ],
    "안정": [
        "처음에는 불안했는데, 근데 할 일을 하나씩 정리하고 나니 마음이 안정됐다.",
        "오전에는 걱정이 많았지만 집에 와서 쉬니까 차분하고 편안해졌다.",
        "예상 밖 일이 있어서 당황했지만 천천히 해결하고 나니 안도감이 들었다.",
        "계속 마음이 흔들렸는데 결국 조용히 정리하면서 평온해졌다.",
    ],
    "설렘": [
        "오늘은 조금 피곤했지만, 근데 내일 여행 생각을 하니까 설레기 시작했다.",
        "처음엔 걱정됐는데 새로운 기회가 생겼다는 생각에 마음이 두근거렸다.",
        "아침에는 무기력했지만 좋아하는 사람을 만날 생각에 기분이 들떴다.",
        "실수 때문에 불안했는데 다음 도전을 준비하다 보니 기대감이 커졌다.",
    ],
    "중립": [
        "아침에는 조금 우울했지만, 근데 오후에는 별일 없이 평범하게 지나갔다.",
        "잠깐 짜증이 났지만 이후에는 특별한 감정 없이 하루를 마무리했다.",
        "처음엔 걱정이 있었는데 확인해 보니 별일 아니어서 무난하게 끝났다.",
        "기분이 조금 오락가락했지만 결국 큰 감정 변화 없이 지나갔다.",
    ],
    "불안": [
        "처음엔 괜찮았는데, 근데 내일 발표 생각을 하니까 갑자기 불안해졌다.",
        "밥을 먹을 때는 좋았지만 미뤄둔 일을 떠올리니 걱정이 커졌다.",
        "오전에는 차분했는데 결과를 기다리다 보니 점점 초조해졌다.",
        "친구와 웃다가도 앞으로 어떻게 될지 생각하니 마음이 불편해졌다.",
    ],
    "피로": [
        "아침에는 기분이 괜찮았는데, 근데 일을 계속하다 보니 너무 피로했다.",
        "좋은 일도 있었지만 하루가 길어서 몸이 무겁고 지쳤다.",
        "처음엔 설렜지만 일정이 너무 많아서 결국 에너지가 바닥났다.",
        "마음은 나쁘지 않았는데 계속 움직이다 보니 무기력하고 피곤해졌다.",
    ],
    "우울": [
        "잠깐 기분이 좋았는데, 근데 혼자 집에 오니 다시 우울해졌다.",
        "친구와 있을 때는 웃었지만 헤어지고 나니 마음이 가라앉았다.",
        "좋은 소식도 있었는데 이상하게 외로운 기분이 더 크게 남았다.",
        "처음에는 괜찮다고 생각했지만 밤이 되니 후회와 슬픔이 밀려왔다.",
    ],
    "화남": [
        "처음엔 참을 만했는데, 근데 같은 말을 또 들으니 결국 화가 났다.",
        "기분 좋게 시작했지만 상대가 무례하게 말해서 짜증이 올라왔다.",
        "처음에는 넘기려고 했는데 계속 억울해서 마음이 거칠어졌다.",
        "좋은 하루였는데 마지막에 부당한 일을 겪고 화가 가라앉지 않았다.",
    ],
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, records: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(records)


def build_records(count_per_label: int, source: str) -> list[dict[str, str]]:
    rng = random.Random(20260528 + count_per_label)
    records = []
    for label, examples in TRANSITION_CASES.items():
        for index in range(count_per_label):
            base = rng.choice(examples)
            if index % 3 == 0:
                text = base
            elif index % 3 == 1:
                text = f"하루를 정리하면 {base}"
            else:
                text = f"오늘 있었던 일을 떠올리면 {base}"
            records.append(
                {
                    "text": text,
                    "main_emotion": label,
                    "sub_emotion": "감정전환",
                    "situation": "다이어리",
                    "source": source,
                }
            )
    rng.shuffle(records)
    return records


def refresh_dataset(file_name: str, count_per_label: int, source: str) -> None:
    path = PROCESSED_DIR / file_name
    records = [
        row
        for row in read_csv(path)
        if row.get("source") not in TRANSITION_SOURCES
    ]
    records.extend(build_records(count_per_label, source))
    random.Random(42).shuffle(records)
    write_csv(path, records)


def write_summary() -> None:
    train_records = read_csv(PROCESSED_DIR / "diary_emotion_train.csv")
    validation_records = read_csv(PROCESSED_DIR / "diary_emotion_validation.csv")
    summary = {
        "train_total": len(train_records),
        "validation_total": len(validation_records),
        "train_distribution": dict(Counter(row["main_emotion"] for row in train_records)),
        "validation_distribution": dict(Counter(row["main_emotion"] for row in validation_records)),
        "notes": [
            "프로젝트 감정 대분류를 행복, 안정, 설렘, 중립, 불안, 피로, 우울, 화남 8개로 구성했습니다.",
            "기존 7개 라벨 데이터는 새 라벨 체계로 매핑했고 부족한 라벨은 합성 다이어리 문장으로 보강했습니다.",
            "근데, 하지만, 그래도처럼 감정이 전환되는 다이어리 문장을 추가 학습 데이터로 보강했습니다.",
            "실제 사용자 다이어리 적용 전 샘플 검수와 추가 데이터 보강이 필요합니다.",
        ],
    }
    (PROCESSED_DIR / "dataset_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> None:
    refresh_dataset("diary_emotion_train.csv", 600, "synthetic_transition_train")
    refresh_dataset("diary_emotion_validation.csv", 80, "synthetic_transition_validation")
    write_summary()
    print("transition training data added")


if __name__ == "__main__":
    main()
