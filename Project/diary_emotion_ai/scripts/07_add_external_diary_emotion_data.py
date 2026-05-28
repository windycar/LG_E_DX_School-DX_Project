from __future__ import annotations

import csv
import json
import random
import re
import time
from collections import Counter
from pathlib import Path
from urllib.parse import urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"
EXTERNAL_DIR = ROOT / "data" / "external"

FIELDNAMES = ["text", "main_emotion", "sub_emotion", "situation", "source"]
EXTERNAL_SOURCES = {
    "hf_kor_diary_emotion_train",
    "hf_kor_diary_emotion_validation",
    "hf_kor_diary_emotion_v2_train",
    "hf_kor_diary_emotion_v2_validation",
}

DATASETS = [
    "LimYeri/kor-diary-emotion",
    "LimYeri/kor-diary-emotion_v2",
]

LABEL_MAP = {
    "기쁨": "행복",
    "행복": "행복",
    "joy": "행복",
    "평온": "안정",
    "안정": "안정",
    "평범함": "중립",
    "설렘": "설렘",
    "놀라움": "설렘",
    "기대": "설렘",
    "중립": "중립",
    "neutral": "중립",
    "불안": "불안",
    "두려움": "불안",
    "공포": "불안",
    "피로": "피로",
    "지침": "피로",
    "슬픔": "우울",
    "우울": "우울",
    "상처": "우울",
    "sadness": "우울",
    "분노": "화남",
    "화남": "화남",
    "불쾌함": "화남",
    "anger": "화남",
    "당황": "불안",
}

PREGNANCY_PREFIXES = [
    "임신하고 나서 ",
    "오늘 아기 생각을 하면서 ",
    "몸과 마음이 예민한 하루였는데 ",
    "출산을 준비하면서 ",
    "배 속 아기를 떠올리니 ",
]

TEXT_COLUMNS = ["text", "sentence", "content", "diary", "일기", "문장"]
LABEL_COLUMNS = ["label", "emotion", "main_emotion", "감정", "대분류"]
SUB_LABEL_COLUMNS = ["sub_emotion", "sub_label", "sub_emotions", "fine_emotions", "소분류", "감정단어"]
SITUATION_COLUMNS = ["situation", "topic", "category", "situation_category", "situation_detail", "상황", "주제"]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, records: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(records)


def fetch_json(url: str) -> dict:
    request = Request(url, headers={"User-Agent": "diary-emotion-ai/1.0"})
    for attempt in range(6):
        try:
            with urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code != 429 or attempt == 5:
                raise
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch JSON: {url}")


def get_splits(dataset: str) -> list[str]:
    url = "https://datasets-server.huggingface.co/splits?" + urlencode({"dataset": dataset})
    data = fetch_json(url)
    return [item["split"] for item in data.get("splits", []) if item.get("split")]


def iter_dataset_rows(dataset: str, split: str, page_size: int = 100, max_rows: int = 12000):
    offset = 0
    while offset < max_rows:
        query = urlencode(
            {
                "dataset": dataset,
                "config": "default",
                "split": split,
                "offset": offset,
                "length": page_size,
            }
        )
        url = f"https://datasets-server.huggingface.co/rows?{query}"
        data = fetch_json(url)
        rows = data.get("rows", [])
        if not rows:
            break
        for item in rows:
            row = item.get("row", item)
            if isinstance(row, dict):
                yield row
        if len(rows) < page_size:
            break
        offset += page_size
        time.sleep(0.35)


def fetch_rows_at_offset(dataset: str, split: str, offset: int, length: int = 100) -> list[dict]:
    query = urlencode(
        {
            "dataset": dataset,
            "config": "default",
            "split": split,
            "offset": offset,
            "length": length,
        }
    )
    url = f"https://datasets-server.huggingface.co/rows?{query}"
    data = fetch_json(url)
    rows = []
    for item in data.get("rows", []):
        row = item.get("row", item)
        if isinstance(row, dict):
            rows.append(row)
    return rows


def cache_label_diversity(path: Path) -> set[str]:
    labels = set()
    if not path.exists():
        return labels
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            label = normalize_label(first_existing(row, LABEL_COLUMNS))
            if label:
                labels.add(label)
    return labels


def enrich_cache_by_offsets(dataset: str, raw_dump_path: Path) -> None:
    existing = set()
    if raw_dump_path.exists():
        with raw_dump_path.open("r", encoding="utf-8") as file:
            for line in file:
                if line.strip():
                    existing.add(line.strip())

    offsets = [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 24000, 28000, 32000, 36000]
    with raw_dump_path.open("a", encoding="utf-8") as file:
        for split in get_splits(dataset):
            for offset in offsets:
                for row in fetch_rows_at_offset(dataset, split, offset):
                    line = json.dumps(row, ensure_ascii=False)
                    if line not in existing:
                        file.write(line + "\n")
                        existing.add(line)
                time.sleep(0.5)


def first_existing(row: dict, columns: list[str]) -> object:
    for column in columns:
        if column in row and row[column] not in (None, ""):
            return row[column]
    return None


def normalize_text(value: object) -> str:
    text = str(value or "")
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[#@][^\s]+", " ", text)
    text = re.sub(r"[\u200b\xa0]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_label(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, list) and value:
        value = value[0]
    label = str(value).strip().strip("'\"[]")
    return LABEL_MAP.get(label, LABEL_MAP.get(label.lower()))


def is_usable_text(text: str) -> bool:
    if not 20 <= len(text) <= 600:
        return False
    hangul_count = len(re.findall(r"[가-힣]", text))
    return hangul_count >= max(10, len(text) * 0.35)


def maybe_pregnancy_style(text: str, label: str, rng: random.Random) -> str:
    pregnancy_words = ["임신", "아기", "태교", "출산", "초음파", "산부인과", "입덧"]
    if any(word in text for word in pregnancy_words):
        return text
    if rng.random() > 0.35:
        return text
    prefix = rng.choice(PREGNANCY_PREFIXES)
    return f"{prefix}{text}"


def collect_external_records() -> list[dict[str, str]]:
    EXTERNAL_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(20260528)
    unique_texts = set()
    records = []

    for dataset in DATASETS:
        dataset_short = dataset.rsplit("/", 1)[-1].replace("-", "_")
        raw_dump_path = EXTERNAL_DIR / f"{dataset_short}_sampled.jsonl"
        if raw_dump_path.exists() and raw_dump_path.stat().st_size > 0:
            if len(cache_label_diversity(raw_dump_path)) < 6:
                enrich_cache_by_offsets(dataset, raw_dump_path)
            row_iterable = (
                json.loads(line)
                for line in raw_dump_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            )
            for row in row_iterable:
                text = normalize_text(first_existing(row, TEXT_COLUMNS))
                label = normalize_label(first_existing(row, LABEL_COLUMNS))
                if label is None or not is_usable_text(text):
                    continue
                text = maybe_pregnancy_style(text, label, rng)
                key = re.sub(r"\s+", "", text)
                if key in unique_texts:
                    continue
                unique_texts.add(key)
                records.append(
                    {
                        "text": text,
                        "main_emotion": label,
                        "sub_emotion": normalize_text(first_existing(row, SUB_LABEL_COLUMNS)) or "외부다이어리",
                        "situation": normalize_text(first_existing(row, SITUATION_COLUMNS)) or "다이어리",
                        "source": f"hf_{dataset_short}",
                    }
                )
            continue

        raw_dump = raw_dump_path.open("w", encoding="utf-8")
        try:
            for split in get_splits(dataset):
                for row in iter_dataset_rows(dataset, split):
                    raw_dump.write(json.dumps(row, ensure_ascii=False) + "\n")
                    text = normalize_text(first_existing(row, TEXT_COLUMNS))
                    label = normalize_label(first_existing(row, LABEL_COLUMNS))
                    if label is None or not is_usable_text(text):
                        continue
                    text = maybe_pregnancy_style(text, label, rng)
                    key = re.sub(r"\s+", "", text)
                    if key in unique_texts:
                        continue
                    unique_texts.add(key)
                    records.append(
                        {
                            "text": text,
                            "main_emotion": label,
                            "sub_emotion": normalize_text(first_existing(row, SUB_LABEL_COLUMNS)) or "외부다이어리",
                            "situation": normalize_text(first_existing(row, SITUATION_COLUMNS)) or "다이어리",
                            "source": f"hf_{dataset_short}",
                        }
                    )
        finally:
            raw_dump.close()

    rng.shuffle(records)
    return records


def cap_per_label(records: list[dict[str, str]], max_per_label: int) -> list[dict[str, str]]:
    grouped: dict[str, list[dict[str, str]]] = {}
    for record in records:
        grouped.setdefault(record["main_emotion"], []).append(record)
    rng = random.Random(42)
    capped = []
    for label, rows in grouped.items():
        rng.shuffle(rows)
        capped.extend(rows[:max_per_label])
    rng.shuffle(capped)
    return capped


def refresh_datasets(new_records: list[dict[str, str]]) -> tuple[Counter, Counter]:
    train_path = PROCESSED_DIR / "diary_emotion_train.csv"
    validation_path = PROCESSED_DIR / "diary_emotion_validation.csv"
    train_records = [
        row for row in read_csv(train_path) if row.get("source") not in EXTERNAL_SOURCES
    ]
    validation_records = [
        row for row in read_csv(validation_path) if row.get("source") not in EXTERNAL_SOURCES
    ]

    capped = cap_per_label(new_records, 1800)
    split_index = int(len(capped) * 0.9)
    train_additions = capped[:split_index]
    validation_additions = capped[split_index:]

    for row in train_additions:
        row["source"] = f"{row['source']}_train"
    for row in validation_additions:
        row["source"] = f"{row['source']}_validation"

    train_records.extend(train_additions)
    validation_records.extend(validation_additions)
    random.Random(42).shuffle(train_records)
    random.Random(43).shuffle(validation_records)
    write_csv(train_path, train_records)
    write_csv(validation_path, validation_records)
    return Counter(row["main_emotion"] for row in train_additions), Counter(
        row["main_emotion"] for row in validation_additions
    )


def write_summary(train_added: Counter, validation_added: Counter) -> None:
    train_records = read_csv(PROCESSED_DIR / "diary_emotion_train.csv")
    validation_records = read_csv(PROCESSED_DIR / "diary_emotion_validation.csv")
    summary = {
        "train_total": len(train_records),
        "validation_total": len(validation_records),
        "train_distribution": dict(Counter(row["main_emotion"] for row in train_records)),
        "validation_distribution": dict(Counter(row["main_emotion"] for row in validation_records)),
        "external_diary_train_added": dict(train_added),
        "external_diary_validation_added": dict(validation_added),
        "external_sources": DATASETS,
        "notes": [
            "외부 공개 한국어 다이어리 감정 데이터셋을 현재 8개 감정 라벨로 매핑해 추가했습니다.",
            "임산부 사용 맥락을 반영하기 위해 일부 문장은 임신/태교/출산 다이어리 문체로 보강했습니다.",
            "LGDX 로컬 크롤링 데이터와 감정 전환 합성 데이터도 함께 유지했습니다.",
            "외부 데이터는 공개 데이터셋 기반이지만 서비스 적용 전 샘플 검수와 추가 수동 라벨링이 필요합니다.",
        ],
    }
    (PROCESSED_DIR / "dataset_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> None:
    records = collect_external_records()
    train_added, validation_added = refresh_datasets(records)
    write_summary(train_added, validation_added)
    result = {
        "collected": len(records),
        "train_added": dict(train_added),
        "validation_added": dict(validation_added),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
