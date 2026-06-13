import os
import json
import shutil
import random
import requests
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, text

import models
import schemas
import database
from ai_service import analyze_emotion as analyze_trained_emotion

router = APIRouter(tags=["Diary & AI Recommendation"])
API_PUBLIC_BASE_URL = os.getenv("API_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
_weekly_recommendation_schema_checked = False

def calculate_pregnancy_week(start_date):
    if not start_date: return 0
    diff_days = (date.today() - start_date).days
    return max(0, diff_days // 7)

def get_recommendation_profile(week: int):
    # 이 안에 1~40주차 딕셔너리 원본 데이터를 동일하게 유지 (길이가 길어 일부 생략 없이 원본 복붙)
    if week <= 12:
        return {
            "range": "1~12주", "fetal_size": "자두~라임", "fetal_weight": "개인차 큼",
            "highlight": "주요 기관 형성과 초기 영양 관리가 중요한 시기입니다.",
            "source_note": "질병관리청 임산부 식이영양, ACOG 임신 중 영양 자료 기준",
            "foods": ["엽산: 시금치·브로콜리·콩류", "단백질: 달걀·두부·살코기", "입덧 시: 크래커·토스트처럼 부담 적은 음식", "수분: 물을 조금씩 자주"],
            "activities": ["무리 없는 짧은 산책", "가벼운 호흡 운동", "피로하면 휴식 우선"],
            "warnings": ["술·흡연 피하기", "날생선·덜 익힌 음식 피하기", "복용 약은 의료진 확인", "심한 복통·출혈은 병원 연락"],
            "contents": [("초기에는 엽산과 약 복용 확인이 우선", "임신 초기 영양과 복용 중인 약을 점검하세요", "🧬", ["엽산 섭취 여부 확인", "복용 중인 약·영양제 산부인과 확인", "술·흡연·날음식 피하기"]), ("입덧이 심하면 먹는 방식부터 바꾸기", "소량씩 자주 먹고 수분을 나누어 섭취하세요", "🍵", ["냄새 강한 음식 피하기", "크래커·토스트처럼 부담 적은 음식 활용", "물도 못 마시면 병원 문의"]), ("첫 산전검사 일정 정리", "검사 날짜와 병원 안내사항을 한곳에 모으세요", "📋", ["초음파·혈액검사 일정 확인", "마지막 생리 시작일 기록", "궁금한 증상 메모"])],
            "checklists": [("초기 산전검사 준비", "첫 검진 전 확인할 항목", "🧾", "서울아산병원 산전검사", ["마지막 생리 시작일 기록", "복용 중인 약·영양제 목록", "출혈·복통 여부 메모"]), ("입덧 관리 체크", "먹고 마시는 패턴을 점검하세요", "🍵", "질병관리청 임산부 식이영양", ["소량씩 자주 먹기", "수분을 조금씩 나누기", "물도 못 마시면 병원 문의"]), ("초기 생활습관 점검", "태아 발달 초기 위험요인을 줄이세요", "🚭", "질병관리청 국가건강정보포털", ["술 피하기", "흡연·간접흡연 피하기", "날음식·덜 익힌 음식 피하기"])],
            "risk_contents": [("초기 출혈과 심한 복통", "가볍게 넘기지 말아야 할 신호", "🚨", "산모 안전 일반 원칙", ["질 출혈", "심한 복통", "어지러움 동반 통증"]), ("심한 입덧과 탈수", "수분 섭취가 안 되면 확인이 필요합니다", "💧", "질병관리청 임산부 식이영양", ["물도 못 마심", "소변량 감소", "계속 토함"]), ("약 복용 전 확인", "임신 초기는 임의 복용을 피하세요", "💊", "산전관리 일반 원칙", ["감기약·진통제 임의 복용 금지", "기존 약 의료진 확인", "영양제 중복 확인"])]
        }
    if week <= 20:
        return {
            "range": "13~20주", "fetal_size": "아보카도~바나나", "fetal_weight": "약 100~300g대",
            "highlight": "태아 움직임과 산모 체형 변화가 점점 뚜렷해지는 시기입니다.",
            "source_note": "질병관리청 신체활동 정보, ACOG 임신 중 운동 자료 기준",
            "foods": ["철분: 살코기·콩류·녹색 채소", "칼슘: 우유·요거트·두부", "비타민 C: 과일·채소", "단백질 식품 매끼 조금씩"],
            "activities": ["걷기 10~20분부터", "가벼운 산전 스트레칭", "오래 앉아 있으면 중간중간 자세 바꾸기"],
            "warnings": ["숨이 너무 차면 중단", "배를 강하게 압박하는 자세 피하기", "어지러움·흉통·출혈 시 운동 중단"],
            "contents": [("가벼운 활동을 생활 루틴에 넣기", "정상 임신이라면 짧은 걷기부터 시작할 수 있어요", "🚶", ["숨이 너무 차지 않는 강도", "운동 전후 물 마시기", "통증·출혈·어지러움이면 중단"]), ("철분과 단백질 챙기기", "태아 성장과 혈액량 증가를 고려하세요", "🩸", ["살코기·달걀·콩류", "녹색 채소와 과일", "어지러움 지속 시 빈혈 확인"]), ("태동 시작은 개인차가 큼", "처음 느끼는 시점이 늦어도 바로 이상은 아닐 수 있어요", "👶", ["주수와 태동 느낌 기록", "정기검진에서 질문", "통증·출혈 동반 시 병원 문의"])],
            "checklists": [("중기 영양 체크", "철분·단백질·칼슘을 챙기세요", "🥚", "질병관리청 임산부 식이영양", ["단백질 식품 포함", "철분 식품 포함", "칼슘 식품 포함"]), ("운동 시작 전 체크", "안전하게 움직이기 위한 기준", "🚶", "ACOG 임신 중 운동", ["의료진 제한 여부 확인", "숨이 너무 차면 중단", "운동 전후 물 마시기"]), ("태동 기록 준비", "느낌과 시간을 가볍게 기록하세요", "👶", "ACOG 태아 발달", ["처음 느낀 시기", "활동 많은 시간대", "평소와 다른 변화"])],
            "risk_contents": [("운동 중 중단 신호", "무리하면 바로 멈추세요", "⚠️", "ACOG 임신 중 운동", ["질출혈", "흉통·어지러움", "규칙적 자궁수축"]), ("빈혈 의심 증상", "어지러움이 지속되면 확인하세요", "🩸", "서울대학교병원 의학정보", ["지속 피로", "어지러움", "숨참"]), ("통증·출혈 동반 태동", "태동 자체보다 동반 증상이 중요합니다", "🚨", "산모 안전 일반 원칙", ["출혈", "심한 복통", "양수 의심"])]
        }
    if week <= 28:
        return {
            "range": "21~28주", "fetal_size": "파파야~가지", "fetal_weight": "약 500g~1kg 전후",
            "highlight": "정밀초음파와 임신당뇨 검사 등 산전검사 관리가 중요해지는 시기입니다.",
            "source_note": "서울아산병원 산전검사, 질병관리청 임산부 영양, ACOG 자료 기준",
            "foods": ["철분과 단백질 식품", "칼슘·비타민 D 식품", "오메가3 생선은 안전한 종류로", "카페인은 하루 총량 확인"],
            "activities": ["중강도 걷기", "수영 또는 수중운동", "옆으로 누워 쉬는 습관"],
            "warnings": ["태동이 확 줄면 병원 연락", "수은 높은 생선 과다 섭취 피하기", "규칙적 배뭉침·출혈·양수 의심 시 연락"],
            "contents": [("정밀초음파와 임신당뇨 검사 준비", "검사 일정과 안내사항을 미리 확인하세요", "🧪", ["검사 날짜 캘린더 저장", "검사 전 주의사항 확인", "결과 설명 메모"]), ("카페인은 총량으로 계산", "커피 외 음료의 카페인도 함께 봐야 합니다", "☕", ["커피·녹차·홍차·콜라 합산", "오후 늦은 카페인 줄이기", "수면 방해 여부 확인"]), ("옆으로 눕는 수면 자세 연습", "중기 이후에는 바로 눕는 자세가 불편할 수 있어요", "😴", ["무릎 사이 베개 활용", "배 아래 받침 사용", "어지러우면 자세 바꾸기"])],
            "checklists": [("정밀초음파 체크", "검사 전후 확인할 내용", "🧪", "서울아산병원 산전검사", ["검사 날짜 확인", "결과 설명 메모", "추가검사 여부 확인"]), ("임신당뇨 검사 체크", "혈당 검사 전후 관리", "📊", "질병관리청 임신당뇨병", ["검사 전 안내사항 확인", "결과 수치 메모", "식사·운동 지시 확인"]), ("수면 자세 체크", "중기 이후 편한 자세 만들기", "🛏️", "ACOG 수면 자세", ["옆으로 눕기", "무릎 사이 베개", "어지러우면 자세 변경"])],
            "risk_contents": [("태동 감소", "평소보다 확 줄면 바로 확인하세요", "👶", "ACOG 태아 발달", ["움직임이 확 줄어듦", "휴식 후에도 변화 없음", "불안하면 병원 문의"]), ("양수 의심", "물이 새는 느낌은 확인이 필요합니다", "🌊", "서울아산병원 조산 정보", ["물처럼 흐름", "속옷이 반복적으로 젖음", "냄새와 색 변화"]), ("규칙적 배뭉침", "반복 간격이 있으면 병원에 문의하세요", "⏱️", "서울아산병원 조산 정보", ["규칙적 간격", "점점 강해짐", "출혈 동반"])]
        }
    if week <= 36:
        return {
            "range": "29~36주", "fetal_size": "호박~멜론", "fetal_weight": "약 1.2~2.6kg 전후",
            "highlight": "태아 성장과 산모의 붓기, 허리 부담, 수면 불편이 커질 수 있는 시기입니다.",
            "source_note": "질병관리청 임신고혈압 정보, ACOG 운동 중단 신호 기준",
            "foods": ["저염식으로 붓기 부담 줄이기", "수분은 낮부터 나누어 섭취", "소량씩 자주 식사", "철분·단백질 꾸준히"],
            "activities": ["짧은 산책", "골반 주변 가벼운 스트레칭", "다리 올리고 쉬기"],
            "warnings": ["갑작스러운 심한 부종·두통 주의", "오래 서 있기 피하기", "숨참·흉통·실신 느낌은 즉시 도움 요청"],
            "contents": [("붓기와 혈압 관련 증상 구분", "갑작스러운 심한 부종은 확인이 필요합니다", "🦶", ["두통·시야 흐림 동반 여부", "오른쪽 윗배 통증 확인", "갑작스러운 얼굴·손 부종 주의"]), ("출산가방과 병원 연락처 정리", "급할 때 바로 움직일 수 있게 준비하세요", "🎒", ["산모수첩·신분증", "병원·보호자 연락처", "이동 수단 확인"]), ("태동 패턴을 평소 기준으로 기억", "평소보다 확 줄면 바로 확인해야 합니다", "🤲", ["활동 많은 시간대 기억", "태동 감소 느낌 기록", "확실히 줄면 병원 문의"])],
            "checklists": [("출산가방 체크", "급할 때 바로 들고 갈 수 있게 준비하세요", "🎒", "산전관리 일반 원칙", ["산모수첩·신분증", "개인 위생용품", "아기 퇴원용품"]), ("부종·혈압 체크", "붓기와 동반 증상을 같이 보세요", "🦶", "질병관리청 임신고혈압", ["얼굴·손 부종", "두통·시야 흐림", "오른쪽 윗배 통증"]), ("병원 연락처 체크", "야간에도 바로 연락 가능하게 준비하세요", "📞", "산전관리 일반 원칙", ["분만 병원 번호", "보호자 연락 순서", "이동 수단"])],
            "risk_contents": [("임신고혈압 의심", "두통과 시야 이상은 중요 신호입니다", "⚠️", "질병관리청 임신고혈압", ["심한 두통", "시야 흐림", "오른쪽 윗배 통증"]), ("조산 의심", "37주 전 규칙적 통증은 확인이 필요합니다", "⏱️", "서울아산병원 조산 정보", ["규칙적 진통", "골반 압박감", "질출혈·분비물 증가"]), ("호흡곤란·흉통", "응급 확인이 필요한 증상입니다", "🏥", "산모 안전 일반 원칙", ["숨쉬기 어려움", "가슴 통증", "실신 느낌"])]
        }
    return {
        "range": "37~40주" if week <= 40 else "40주 이후", "fetal_size": "수박", "fetal_weight": "약 2.8kg 이상 개인차",
        "highlight": "분만 신호와 태동 변화를 가장 우선해서 확인해야 하는 시기입니다.",
        "source_note": "서울아산병원 조산·산전검사 정보, ACOG 태동·운동 안전 기준",
        "foods": ["소화 잘 되는 식사", "수분 충분히", "변비 예방 식이섬유", "무리한 보양식보다 균형식"],
        "activities": ["가벼운 걷기", "호흡 이완", "출산가방·병원 연락처 확인"],
        "warnings": ["규칙적 진통은 병원 연락", "양수 의심·출혈 시 즉시 연락", "태동 감소는 바로 확인", "예정일 이후 진료 일정 우선"],
        "contents": [("분만 신호는 병원 연락이 먼저", "규칙적 진통, 양수, 출혈은 바로 확인하세요", "🏥", ["진통 간격 기록", "물이 새는 느낌 확인", "출혈 있으면 바로 연락"]), ("응급 연락 체계 최종 확인", "분만 병원과 이동 계획을 바로 볼 수 있게 정리하세요", "📞", ["분만 병원 번호", "보호자 연락 순서", "야간 이동 방법"]), ("막달에도 태동 감소는 중요", "아기가 덜 움직인다고 느끼면 기다리지 마세요", "👶", ["평소와 다른 감소 확인", "휴식 후에도 감소하면 연락", "앱 답변보다 병원 우선"])],
        "checklists": [("분만 신호 체크", "연락해야 할 기준을 미리 정리하세요", "🏥", "서울아산병원 분만 관련 정보", ["규칙적 진통", "양수 의심", "출혈"]), ("막달 이동 준비", "바로 병원에 갈 수 있게 준비하세요", "🚗", "산전관리 일반 원칙", ["가방 위치", "차량·택시 계획", "병원 연락처"]), ("예정일 이후 체크", "담당의 추적 계획을 우선하세요", "📋", "산전관리 일반 원칙", ["검진 예약", "태동 변화", "유도분만 상담 여부"])],
        "risk_contents": [("태동 감소", "막달에도 태동 감소는 바로 확인하세요", "👶", "ACOG 태아 발달", ["평소보다 확 줄어듦", "휴식 후에도 감소", "불안하면 병원 연락"]), ("양수·출혈", "분만 또는 응급 신호일 수 있습니다", "🌊", "서울아산병원 산전관리", ["물이 흐름", "선홍색 출혈", "복통 동반"]), ("응급 증상", "앱보다 119 또는 응급실이 먼저입니다", "🚨", "산모 안전 일반 원칙", ["호흡곤란", "흉통", "실신"])]
    }

def ensure_ai_recommendation_seed():
    with database.SessionLocal() as db:
        ensure_weekly_recommendation_schema(db)
        def add_if_missing(week, recommendation_type, title, content):
            existing = db.query(models.WeeklyAiRecommendation).filter(
                models.WeeklyAiRecommendation.user_id.is_(None),
                models.WeeklyAiRecommendation.pregnancy_week == week,
                models.WeeklyAiRecommendation.recommendation_type == recommendation_type,
                models.WeeklyAiRecommendation.title == title,
            ).first()
            if not existing:
                db.add(models.WeeklyAiRecommendation(
                    user_id=None, diary_id=None, pregnancy_week=week, recommendation_type=recommendation_type, title=title, content=content
                ))

        for week in range(1, 41):
            profile = get_recommendation_profile(week)
            add_if_missing(week, "META", profile["range"], json.dumps({"range": profile["range"], "fetalSize": profile["fetal_size"], "fetalWeight": profile["fetal_weight"], "highlight": profile["highlight"], "sourceNote": profile["source_note"]}, ensure_ascii=False))
            for item in profile["foods"]: add_if_missing(week, "FOOD", item, item)
            for item in profile["activities"]: add_if_missing(week, "ACTIVITY", item, item)
            for item in profile["warnings"]: add_if_missing(week, "WARNING", item, item)
            for title, subtitle, emoji, bullets in profile["contents"]: add_if_missing(week, "CONTENT_WEEKLY", title, json.dumps({"subtitle": subtitle, "emoji": emoji, "source": profile["source_note"], "bullets": bullets}, ensure_ascii=False))
            for title, subtitle, emoji, source, bullets in profile["checklists"]: add_if_missing(week, "CONTENT_CHECKLIST", title, json.dumps({"subtitle": subtitle, "emoji": emoji, "source": source, "bullets": bullets}, ensure_ascii=False))
            for title, subtitle, emoji, source, bullets in profile["risk_contents"]: add_if_missing(week, "CONTENT_WARNING", title, json.dumps({"subtitle": subtitle, "emoji": emoji, "source": source, "bullets": bullets}, ensure_ascii=False))
        db.commit()

def ensure_weekly_recommendation_schema(db: Session):
    global _weekly_recommendation_schema_checked
    if _weekly_recommendation_schema_checked:
        return
    required_columns = {
        "user_id": "ADD COLUMN user_id BIGINT NULL",
        "diary_id": "ADD COLUMN diary_id BIGINT NULL",
        "personalized_reason": "ADD COLUMN personalized_reason TEXT NULL",
        "created_at": "ADD COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP",
    }
    existing = {
        row[0]
        for row in db.execute(text("SHOW COLUMNS FROM WEEKLY_AI_RECOMMENDATIONS")).fetchall()
    }
    for column, ddl in required_columns.items():
        if column not in existing:
            db.execute(text(f"ALTER TABLE WEEKLY_AI_RECOMMENDATIONS {ddl}"))
    db.commit()
    _weekly_recommendation_schema_checked = True

# Helper 함수들 복구
def parse_recommendation_content(content: str):
    try: return json.loads(content)
    except Exception: return {"subtitle": content, "emoji": "📌", "source": "WEEKLY_AI_RECOMMENDATIONS", "bullets": [content]}

def format_content_recommendation(row, content_type: str):
    parsed = parse_recommendation_content(row.content)
    return {"id": int(row.recommendation_id), "type": content_type, "emoji": parsed.get("emoji", "📌"), "title": row.title, "subtitle": parsed.get("subtitle", ""), "source": parsed.get("source", ""), "bullets": parsed.get("bullets", [])}

def unique_content_rows(rows, limit=3):
    result, seen_titles = [], set()
    for row in rows:
        if row.title not in seen_titles:
            seen_titles.add(row.title); result.append(row)
        if len(result) >= limit: break
    return result

def unique_titles(rows, fallback_items=None, limit=None):
    result, seen_titles = [], set()
    for row in rows:
        if row.title not in seen_titles:
            seen_titles.add(row.title); result.append(row.title)
        if limit and len(result) >= limit: return result
    for title in fallback_items or []:
        if title not in seen_titles:
            seen_titles.add(title); result.append(title)
        if limit and len(result) >= limit: break
    return result

def filter_rows_by_titles(rows, expected_titles):
    expected = set(expected_titles)
    return [row for row in rows if row.title in expected]

def profile_content_items(items, content_type, source_note=None, id_offset=0):
    result = []
    for index, item in enumerate(items):
        if len(item) == 4: title, subtitle, emoji, bullets = item; source = source_note or "공식 임신 건강정보"
        else: title, subtitle, emoji, source, bullets = item
        result.append({"id": id_offset + index, "type": content_type, "emoji": emoji, "title": title, "subtitle": subtitle, "source": source, "bullets": bullets})
    return result

def content_group_from_rows(rows, expected_items, content_type, source_note=None, id_offset=0):
    expected_titles = [item[0] for item in expected_items]
    filtered = unique_content_rows(filter_rows_by_titles(rows, expected_titles), limit=len(expected_items))
    if len(filtered) >= len(expected_items): return [format_content_recommendation(row, content_type) for row in filtered]
    return profile_content_items(expected_items, content_type, source_note, id_offset)

def unique_ordered(items):
    result, seen = [], set()
    for item in items:
        if item and item not in seen:
            seen.add(item)
            result.append(item)
    return result

def analyze_recent_diary_context(db: Session, user_id: int):
    logs = (
        db.query(models.DiaryLog)
        .filter(models.DiaryLog.user_id == user_id)
        .order_by(models.DiaryLog.recorded_at.desc())
        .limit(5)
        .all()
    )
    if not logs:
        return {
            "applied": False,
            "basisCount": 0,
            "recentEmotion": None,
            "keywords": [],
            "summary": "최근 다이어리 기록이 없어 주차 기준 추천만 제공합니다.",
            "foods": [],
            "activities": [],
            "warnings": [],
        }

    diary_ids = [log.diary_id for log in logs]
    analysis_rows = db.query(models.AiAnalysisResult).filter(models.AiAnalysisResult.diary_id.in_(diary_ids)).all()
    analysis_by_diary_id = {row.diary_id: row.detected_emotion for row in analysis_rows}

    text = " ".join([f"{log.selected_emotion or ''} {log.diary_content or ''} {analysis_by_diary_id.get(log.diary_id, '')}" for log in logs]).lower()
    emotions = [analysis_by_diary_id.get(log.diary_id) or log.selected_emotion for log in logs if analysis_by_diary_id.get(log.diary_id) or log.selected_emotion]
    emotion_counts = {}
    for emotion in emotions:
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    recent_emotion = max(emotion_counts.items(), key=lambda item: item[1])[0] if emotion_counts else None

    rules = [
        {
            "keyword": "입덧",
            "terms": ["입덧", "울렁", "메스꺼", "구토", "토했", "토할"],
            "foods": ["입덧 시: 크래커·토스트처럼 부담 적은 음식", "수분: 물을 조금씩 자주"],
            "activities": ["피로하면 휴식 우선"],
            "warnings": ["물도 못 마시거나 계속 토하면 병원 문의"],
        },
        {
            "keyword": "피로",
            "terms": ["피곤", "피로", "지침", "기운", "무기력", "힘들"],
            "foods": ["단백질 식품 매끼 조금씩", "철분과 단백질 식품"],
            "activities": ["피로하면 휴식 우선", "짧은 산책"],
            "warnings": ["지속 피로·어지러움이 있으면 빈혈 여부 확인"],
        },
        {
            "keyword": "수면",
            "terms": ["잠", "수면", "불면", "못잤", "뒤척", "새벽"],
            "foods": ["오후 늦은 카페인 줄이기"],
            "activities": ["옆으로 누워 쉬는 습관", "호흡 이완"],
            "warnings": ["수면 방해가 심하면 정기검진 때 상담"],
        },
        {
            "keyword": "붓기",
            "terms": ["붓", "부종", "다리", "발이", "손이"],
            "foods": ["저염식으로 붓기 부담 줄이기", "수분은 낮부터 나누어 섭취"],
            "activities": ["다리 올리고 쉬기", "오래 앉아 있으면 중간중간 자세 바꾸기"],
            "warnings": ["갑작스러운 심한 부종·두통 주의"],
        },
        {
            "keyword": "허리통증",
            "terms": ["허리", "골반", "통증", "아파", "아픔", "뻐근"],
            "foods": ["단백질 식품 매끼 조금씩"],
            "activities": ["골반 주변 가벼운 스트레칭", "가벼운 산전 스트레칭"],
            "warnings": ["심한 통증·출혈·규칙적 배뭉침이 있으면 병원 문의"],
        },
        {
            "keyword": "불안",
            "terms": ["불안", "걱정", "무섭", "두렵", "초조", "화가", "우울", "속상"],
            "foods": ["수분 충분히", "소화 잘 되는 식사"],
            "activities": ["가벼운 호흡 운동", "호흡 이완", "짧은 산책"],
            "warnings": ["불안이 지속되거나 일상생활이 어려우면 의료진 상담"],
        },
    ]

    matched_keywords, foods, activities, warnings = [], [], [], []
    for rule in rules:
        if any(term in text for term in rule["terms"]):
            matched_keywords.append(rule["keyword"])
            foods.extend(rule["foods"])
            activities.extend(rule["activities"])
            warnings.extend(rule["warnings"])

    if recent_emotion in ["불안", "우울", "화남", "피로"]:
        if "불안" not in matched_keywords:
            matched_keywords.append(recent_emotion)
        activities.extend(["가벼운 호흡 운동", "피로하면 휴식 우선"])
        warnings.extend(["감정 기복이 오래 지속되면 의료진 또는 상담 전문가에게 문의"])

    applied = bool(matched_keywords)
    summary = (
        f"최근 다이어리 {len(logs)}개에서 {', '.join(unique_ordered(matched_keywords))} 흐름이 보여 관련 항목을 앞에 배치했습니다."
        if applied else
        f"최근 다이어리 {len(logs)}개를 확인했지만 특정 불편 키워드가 뚜렷하지 않아 주차 기준 추천을 유지했습니다."
    )
    return {
        "applied": applied,
        "basisCount": len(logs),
        "basisDiaryId": logs[0].diary_id if logs else None,
        "recentEmotion": recent_emotion,
        "keywords": unique_ordered(matched_keywords),
        "summary": summary,
        "foods": unique_ordered(foods),
        "activities": unique_ordered(activities),
        "warnings": unique_ordered(warnings),
    }

def upsert_personalized_weekly_recommendations(db: Session, user_id: int, pregnancy_week: int, diary_context: dict, foods: list[str], activities: list[str], warnings: list[str]):
    if not diary_context.get("applied"):
        return
    basis_diary_id = diary_context.get("basisDiaryId")
    reason = diary_context.get("summary")
    rows_to_save = [
        ("FOOD", foods[:3]),
        ("ACTIVITY", activities[:3]),
        ("WARNING", warnings[:3]),
    ]
    for recommendation_type, titles in rows_to_save:
        for title in titles:
            existing = db.query(models.WeeklyAiRecommendation).filter(
                models.WeeklyAiRecommendation.user_id == user_id,
                models.WeeklyAiRecommendation.pregnancy_week == pregnancy_week,
                models.WeeklyAiRecommendation.recommendation_type == recommendation_type,
                models.WeeklyAiRecommendation.title == title,
            ).first()
            if existing:
                existing.diary_id = basis_diary_id
                existing.content = title
                existing.personalized_reason = reason
            else:
                db.add(models.WeeklyAiRecommendation(
                    user_id=user_id,
                    diary_id=basis_diary_id,
                    pregnancy_week=pregnancy_week,
                    recommendation_type=recommendation_type,
                    title=title,
                    content=title,
                    personalized_reason=reason,
                ))
    db.commit()

@router.get("/api/ai/weekly-recommendations/{identifier}")
def get_weekly_ai_recommendations(identifier: str, db: Session = Depends(database.get_db)):
    ensure_weekly_recommendation_schema(db)
    if identifier.isdigit():
        user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user: raise HTTPException(status_code=404, detail="User not found")
    target_user = user
    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent: target_user = parent

    pregnancy_week = calculate_pregnancy_week(target_user.pregnancy_start_date)
    query_week = min(max(pregnancy_week, 1), 40)
    profile = get_recommendation_profile(query_week)
    rows = db.query(models.WeeklyAiRecommendation).filter(
        models.WeeklyAiRecommendation.user_id.is_(None),
        models.WeeklyAiRecommendation.pregnancy_week == query_week,
    ).all()

    if not rows:
        ensure_ai_recommendation_seed()
        rows = db.query(models.WeeklyAiRecommendation).filter(
            models.WeeklyAiRecommendation.user_id.is_(None),
            models.WeeklyAiRecommendation.pregnancy_week == query_week,
        ).all()

    grouped = {}
    for row in rows: grouped.setdefault(row.recommendation_type, []).append(row)

    meta_rows = filter_rows_by_titles(grouped.get("META", []), [profile["range"]])
    meta_row = meta_rows[0] if meta_rows else None
    meta = parse_recommendation_content(meta_row.content) if meta_row else {"range": profile["range"], "fetalSize": profile["fetal_size"], "fetalWeight": profile["fetal_weight"], "highlight": profile["highlight"], "sourceNote": profile["source_note"]}
    diary_context = analyze_recent_diary_context(db, target_user.id)
    foods = unique_ordered(diary_context["foods"] + unique_titles(filter_rows_by_titles(grouped.get("FOOD", []), profile["foods"]), profile["foods"]))
    activities = unique_ordered(diary_context["activities"] + unique_titles(filter_rows_by_titles(grouped.get("ACTIVITY", []), profile["activities"]), profile["activities"]))
    warnings = unique_ordered(diary_context["warnings"] + unique_titles(filter_rows_by_titles(grouped.get("WARNING", []), profile["warnings"]), profile["warnings"]))
    upsert_personalized_weekly_recommendations(db, target_user.id, query_week, diary_context, foods, activities, warnings)
    personalized_rows = db.query(models.WeeklyAiRecommendation).filter(
        models.WeeklyAiRecommendation.user_id == target_user.id,
        models.WeeklyAiRecommendation.pregnancy_week == query_week,
    ).order_by(models.WeeklyAiRecommendation.created_at.desc()).all()
    
    return {
        "status": "Success",
        "user_id": target_user.id, "baby_nickname": target_user.baby_nickname,
        "pregnancy_start_date": str(target_user.pregnancy_start_date) if target_user.pregnancy_start_date else None,
        "pregnancy_week": pregnancy_week, "query_week": query_week,
        "guide": {
            "range": meta.get("range"), "fetalSize": meta.get("fetalSize"), "fetalWeight": meta.get("fetalWeight"),
            "highlight": meta.get("highlight"), "foods": foods[:6],
            "activities": activities[:6],
            "warnings": warnings[:6],
            "sourceNote": meta.get("sourceNote"),
            "personalization": diary_context,
            "savedRecommendationCount": len(personalized_rows),
        },
        "contents": {
            "weekly": content_group_from_rows(grouped.get("CONTENT_WEEKLY", []), profile["contents"], "이번 주", profile["source_note"], 1000),
            "checklist": content_group_from_rows(grouped.get("CONTENT_CHECKLIST", []), profile["checklists"], "체크리스트", None, 2000),
            "warning": content_group_from_rows(grouped.get("CONTENT_WARNING", []), profile["risk_contents"], "위험신호", None, 3000),
        },
    }

@router.post("/api/ai/emotion")
def analyze_diary_emotion(req: schemas.EmotionRequest, request: Request):
    if not req.text.strip(): return {"status": "Error", "message": "텍스트가 없습니다."}
    text = req.text.lower()
    scores = {
        "화남": {"emoji": "😡", "score": 0.0},
        "우울": {"emoji": "😔", "score": 0.0},
        "힘듦": {"emoji": "😫", "score": 0.0},
        "불안": {"emoji": "😟", "score": 0.0},
        "중립": {"emoji": "😐", "score": 0.4},
        "안정": {"emoji": "🙂", "score": 0.0},
        "설렘": {"emoji": "🥰", "score": 0.0},
        "행복": {"emoji": "😊", "score": 0.0},
    }
    lexicon = [
        ("화남", 2.2, ["화가", "화남", "짜증", "분노", "열받", "빡", "피해다니", "싫다"]),
        ("우울", 2.0, ["우울", "슬프", "눈물", "외롭", "속상", "무기력", "서럽"]),
        ("힘듦", 1.8, ["힘들", "지침", "피곤", "아픔", "통증", "입덧", "못자", "버겁"]),
        ("불안", 2.0, ["불안", "걱정", "무섭", "두렵", "초조", "긴장", "혹시"]),
        ("안정", 1.8, ["괜찮", "풀렸", "나아졌", "안정", "차분", "버틸만"]),
        ("행복", 2.0, ["행복", "좋았", "기쁘", "웃", "편안", "고마", "다행"]),
        ("설렘", 2.0, ["사랑", "태동", "아기", "설렘", "소중", "귀여"]),
    ]
    sentences = [part.strip() for part in text.replace("!", ".").replace("?", ".").replace("\n", ".").split(".") if part.strip()] or [text]
    for index, sentence in enumerate(sentences):
        multiplier = 1.0
        if index == len(sentences) - 1:
            multiplier += 0.4
        if any(token in sentence for token in ["하지만", "그래도", "근데", "그런데", "결국", "다행히", "그래서"]):
            multiplier += 0.8
        if any(token in sentence for token in ["아니", "않", "안 ", "못 ", "없"]):
            multiplier -= 0.25
        multiplier = max(0.4, multiplier)

        for label, weight, keywords in lexicon:
            hit_count = sum(1 for keyword in keywords if keyword in sentence)
            if hit_count:
                scores[label]["score"] += weight * hit_count * multiplier

    if any(token in text for token in ["마음이 풀", "괜찮아졌", "나아졌", "고마웠", "다행"]):
        scores["화남"]["score"] *= 0.45
        scores["불안"]["score"] *= 0.7
        scores["안정"]["score"] += 1.5
        scores["행복"]["score"] += 0.8

    best_label, best = max(scores.items(), key=lambda item: item[1]["score"])
    if best["score"] > 0.4:
        return {"status": "Success", "emotion_label": best_label, "emoji": best["emoji"], "method": "weighted_context", "score": round(best["score"], 1)}
    try:
        diary_ai = request.app.state.diary_ai
        AI_MODEL = request.app.state.AI_MODEL
        prediction, _ = diary_ai.predict(AI_MODEL, req.text)
        emoji_map = {"행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐", "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"}
        return {"status": "Success", "emotion_label": prediction, "emoji": emoji_map.get(prediction, "😐")}
    except Exception as e:
        return {"status": "Error", "message": "AI 오류가 발생했습니다."}

@router.post("/api/ai/emotion-v2")
def analyze_diary_emotion_v2(req: schemas.EmotionRequest):
    text = req.text.strip().lower()
    if not text:
        return {"status": "Error", "message": "분석할 일기 내용이 없습니다."}

    trained_label_map = {
        "기쁨": ("행복", "😊"),
        "슬픔": ("우울", "😔"),
        "분노": ("화남", "😡"),
        "불안": ("불안", "😟"),
        "상처": ("우울", "😔"),
        "당황": ("불안", "😟"),
        "중립": ("보통", "😐"),
    }

    try:
        trained_result = analyze_trained_emotion(req.text)
        trained_label = trained_result["main_emotion"]
        display_label, emoji = trained_label_map.get(trained_label, ("보통", "😐"))
        return {
            "status": "Success",
            "emotion_label": display_label,
            "model_label": trained_label,
            "emoji": emoji,
            "method": "trained_naive_bayes",
            "confidence": trained_result["confidence"],
            "score": round(float(trained_result["confidence"]) * 100, 1),
            "description": trained_result.get("description", ""),
        }
    except Exception as exc:
        print(f"trained diary emotion model failed; using weighted fallback: {exc}")

    scores = {
        "화남": {"emoji": "😡", "score": 0.0},
        "우울": {"emoji": "😔", "score": 0.0},
        "힘듦": {"emoji": "😫", "score": 0.0},
        "불안": {"emoji": "😟", "score": 0.0},
        "보통": {"emoji": "😐", "score": 0.4},
        "괜찮음": {"emoji": "🙂", "score": 0.0},
        "설렘": {"emoji": "🥰", "score": 0.0},
        "행복": {"emoji": "😊", "score": 0.0},
    }
    lexicon = [
        ("화남", 2.2, ["화가", "화남", "짜증", "분노", "열받", "억울", "싫다", "미워"]),
        ("우울", 2.0, ["우울", "슬프", "눈물", "외롭", "속상", "무기력", "서럽"]),
        ("힘듦", 1.8, ["힘들", "지침", "피곤", "아픔", "통증", "입덧", "못 자", "버겁"]),
        ("불안", 2.0, ["불안", "걱정", "무섭", "두렵", "초조", "긴장", "혹시"]),
        ("괜찮음", 1.8, ["괜찮", "풀렸", "나아졌", "안정", "차분", "버틸 만"]),
        ("행복", 2.0, ["행복", "좋았", "기쁘", "웃", "편안", "고마", "다행"]),
        ("설렘", 2.0, ["사랑", "태동", "아기", "설렘", "소중", "귀여"]),
    ]
    sentences = [
        part.strip()
        for part in text.replace("!", ".").replace("?", ".").replace("\n", ".").split(".")
        if part.strip()
    ] or [text]

    for index, sentence in enumerate(sentences):
        multiplier = 1.4 if index == len(sentences) - 1 else 1.0
        if any(token in sentence for token in ["하지만", "그래도", "근데", "그런데", "결국", "다행히", "그래서"]):
            multiplier += 0.8
        if any(token in sentence for token in ["아니", "않", "안 ", "못 ", "없"]):
            multiplier = max(0.4, multiplier - 0.25)

        for label, weight, keywords in lexicon:
            hit_count = sum(1 for keyword in keywords if keyword in sentence)
            scores[label]["score"] += weight * hit_count * multiplier

    if any(token in text for token in ["마음이 풀", "괜찮아졌", "나아졌", "고마웠", "다행"]):
        scores["화남"]["score"] *= 0.45
        scores["불안"]["score"] *= 0.7
        scores["괜찮음"]["score"] += 1.5
        scores["행복"]["score"] += 0.8

    best_label, best = max(scores.items(), key=lambda item: item[1]["score"])
    return {
        "status": "Success",
        "emotion_label": best_label,
        "emoji": best["emoji"],
        "method": "weighted_context",
        "score": round(best["score"], 1),
    }


@router.post("/api/diary/logs")
def create_diary_log(
    user_id: int = Form(...), selected_emotion: str = Form(...), diary_content: str = Form(...),
    detected_emotion: str = Form(None), image: UploadFile = File(None), date: str = Form(None),
    db: Session = Depends(database.get_db)
):
    try:
        saved_image_path = None
        if image:
            saved_image_path = f"uploads/{image.filename}"
            with open(saved_image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

        WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
        weather_desc = "알 수 없음"
        if WEATHER_API_KEY:
            res = requests.get(f"http://api.openweathermap.org/data/2.5/weather?q=Gwangju,KR&appid={WEATHER_API_KEY}&lang=kr")
            if res.status_code == 200: weather_desc = res.json()['weather'][0]['description']

        reverse_emoji_map = {"😊": "행복", "🙂": "안정", "🥰": "설렘", "😐": "중립", "😟": "불안", "😫": "피로", "😔": "우울", "😡": "화남"}
        db_emotion_text = reverse_emoji_map.get(selected_emotion, selected_emotion)
        
        new_diary = models.DiaryLog(
            user_id=user_id, selected_emotion=db_emotion_text, diary_content=diary_content,
            image_path=saved_image_path, temperature_ambient=round(random.uniform(21.0, 26.0), 1),
            humidity_ambient=round(random.uniform(40.0, 60.0), 1), weather_ambient=weather_desc           
        )
        if date: new_diary.recorded_at = datetime.strptime(date, "%Y-%m-%d")

        db.add(new_diary)
        db.flush()

        if detected_emotion:
            db.add(models.AiAnalysisResult(diary_id=new_diary.diary_id, detected_emotion=detected_emotion))

        db.commit()
        return {"status": "Success", "message": "성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback() 
        return {"status": "Error", "message": str(e)}


@router.delete("/api/diary/logs/{diary_id}")
def delete_diary_log(
    diary_id: int,
    user_id: int,
    db: Session = Depends(database.get_db),
):
    diary = db.query(models.DiaryLog).filter(models.DiaryLog.diary_id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="삭제할 다이어리를 찾을 수 없습니다.")
    if diary.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인이 작성한 다이어리만 삭제할 수 있습니다.")

    image_path = diary.image_path
    image_is_shared = bool(
        image_path
        and db.query(models.DiaryLog).filter(
            models.DiaryLog.image_path == image_path,
            models.DiaryLog.diary_id != diary_id,
        ).first()
    )

    try:
        # This foreign key has no ON DELETE action in the current MySQL schema.
        db.query(models.WeeklyAiRecommendation).filter(
            models.WeeklyAiRecommendation.diary_id == diary_id
        ).update(
            {models.WeeklyAiRecommendation.diary_id: None},
            synchronize_session=False,
        )
        db.delete(diary)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"다이어리 삭제에 실패했습니다: {exc}")

    if image_path and not image_is_shared:
        uploads_root = os.path.abspath("uploads")
        stored_image = os.path.abspath(image_path)
        if os.path.commonpath([uploads_root, stored_image]) == uploads_root and os.path.isfile(stored_image):
            try:
                os.remove(stored_image)
            except OSError:
                pass

    return {"status": "Success", "message": "다이어리가 삭제되었습니다."}


@router.put("/api/diary/logs/{diary_id}")
def update_diary_log(
    diary_id: int,
    user_id: int = Form(...),
    selected_emotion: str = Form(...),
    diary_content: str = Form(...),
    detected_emotion: str = Form(None),
    image: UploadFile = File(None),
    date: str = Form(None),
    remove_image: bool = Form(False),
    db: Session = Depends(database.get_db),
):
    diary = db.query(models.DiaryLog).filter(models.DiaryLog.diary_id == diary_id).first()
    if not diary:
        raise HTTPException(status_code=404, detail="수정할 다이어리를 찾을 수 없습니다.")
    if diary.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인이 작성한 다이어리만 수정할 수 있습니다.")

    old_image_path = diary.image_path
    new_image_path = old_image_path

    try:
        if image:
            new_image_path = f"uploads/{image.filename}"
            with open(new_image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
        elif remove_image:
            new_image_path = None

        reverse_emoji_map = {
            "😊": "행복",
            "🙂": "안정",
            "🥰": "설렘",
            "😐": "중립",
            "😟": "불안",
            "😫": "피로",
            "😔": "우울",
            "😡": "화남",
        }
        diary.selected_emotion = reverse_emoji_map.get(selected_emotion, selected_emotion)
        diary.diary_content = diary_content
        diary.image_path = new_image_path
        if date:
            diary.recorded_at = datetime.strptime(date, "%Y-%m-%d")

        analysis = (
            db.query(models.AiAnalysisResult)
            .filter(models.AiAnalysisResult.diary_id == diary_id)
            .first()
        )
        if detected_emotion:
            if analysis:
                analysis.detected_emotion = detected_emotion
            else:
                db.add(models.AiAnalysisResult(
                    diary_id=diary_id,
                    detected_emotion=detected_emotion,
                ))

        db.commit()
    except ValueError:
        db.rollback()
        raise HTTPException(status_code=400, detail="날짜 형식이 올바르지 않습니다.")
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"다이어리 수정에 실패했습니다: {exc}")

    if old_image_path and old_image_path != new_image_path:
        image_is_shared = bool(
            db.query(models.DiaryLog).filter(
                models.DiaryLog.image_path == old_image_path,
                models.DiaryLog.diary_id != diary_id,
            ).first()
        )
        uploads_root = os.path.abspath("uploads")
        stored_image = os.path.abspath(old_image_path)
        if (
            not image_is_shared
            and os.path.commonpath([uploads_root, stored_image]) == uploads_root
            and os.path.isfile(stored_image)
        ):
            try:
                os.remove(stored_image)
            except OSError:
                pass

    return {"status": "Success", "message": "다이어리가 수정되었습니다."}


@router.get("/api/diary/logs/{user_id}")
def get_diary_logs(user_id: int, db: Session = Depends(database.get_db)):
    try:
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).order_by(models.DiaryLog.recorded_at.desc()).all()
        keyword_to_emoji = {"행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐", "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"}
        diary_result, smalltalk_result = [], []
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        partner_id = None
        if user:
            if str(user.role).upper() == "PREGNANT":
                guardian = db.query(models.User).filter(
                    models.User.parent_user_id == user.id,
                    func.upper(models.User.role) == "GUARDIAN",
                ).first()
                partner_id = user.parent_user_id or (guardian.id if guardian else None)
            else:
                partner_id = user.parent_user_id

        my_answers = (
            db.query(models.SmallTalkAnswer)
            .filter(models.SmallTalkAnswer.user_id == user_id)
            .order_by(models.SmallTalkAnswer.created_at.desc())
            .all()
        )
        topic_ids = {answer.topic_id for answer in my_answers}
        topics_by_id = {
            topic.topic_id: topic
            for topic in db.query(models.SmallTalkTopic)
            .filter(models.SmallTalkTopic.topic_id.in_(topic_ids))
            .all()
        } if topic_ids else {}

        partner_answers_by_topic = {}
        if partner_id and topic_ids:
            partner_answers = (
                db.query(models.SmallTalkAnswer)
                .filter(
                    models.SmallTalkAnswer.user_id == partner_id,
                    models.SmallTalkAnswer.topic_id.in_(topic_ids),
                )
                .order_by(models.SmallTalkAnswer.created_at.desc())
                .all()
            )
            for answer in partner_answers:
                partner_answers_by_topic.setdefault(answer.topic_id, answer)

        smalltalk_by_date = {}
        for my_answer in my_answers:
            topic = topics_by_id.get(my_answer.topic_id)
            if not topic:
                continue

            date_str = (
                str(my_answer.created_at).split(" ")[0]
                if my_answer.created_at
                else "2026-05-26"
            )
            partner_answer = partner_answers_by_topic.get(my_answer.topic_id)
            item = {
                "id": my_answer.answer_id,
                "date": date_str,
                "topic": topic.question_text,
                "my_answer": my_answer.answer_content,
                "partner_answer": (
                    partner_answer.answer_content
                    if partner_answer
                    else "아직 답변하지 않았습니다."
                ),
            }
            smalltalk_result.append(item)
            smalltalk_by_date.setdefault(date_str, item)
        
        for log in logs:
            date_str = str(log.recorded_at).split(" ")[0] if log.recorded_at else "2026-05-26"
            entry = {
                "id": log.diary_id, "date": date_str, "mood": keyword_to_emoji.get(log.selected_emotion, "😐"),
                "content": log.diary_content, "images": [f"{API_PUBLIC_BASE_URL}/{log.image_path}"] if log.image_path else [], "type": "daily"
            }
            if date_str in smalltalk_by_date:
                smalltalk = smalltalk_by_date[date_str]
                entry["smalltalk"] = {
                    "topic": smalltalk["topic"],
                    "my_answer": smalltalk["my_answer"],
                    "partner_answer": smalltalk["partner_answer"],
                }
            diary_result.append(entry)

        return {"status": "Success", "diary_entries": diary_result, "smalltalk_entries": smalltalk_result}
    except Exception as e: return {"status": "Error", "message": str(e)}
