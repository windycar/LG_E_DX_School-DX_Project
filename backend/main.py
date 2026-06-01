import os
import sys
import json
import shutil
import random
import string
import requests
import importlib
from datetime import datetime, date

from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel
from dotenv import load_dotenv

import models
import schemas
import database
import smalltalk_service

# =====================================================================
# 🛠️ 1. 초기 설정 (DB, CORS, 정적 파일)
# =====================================================================
load_dotenv()
models.Base.metadata.create_all(bind=database.engine)
API_PUBLIC_BASE_URL = os.getenv("API_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
BACKEND_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("BACKEND_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]


def ensure_mission_schema():
    mission_columns = {
        "status_check_id": "BIGINT NULL",
        "mission_title": "VARCHAR(200) NOT NULL DEFAULT '오늘의 케어 미션'",
        "mission_reason": "TEXT NULL",
        "mission_type": "VARCHAR(50) NOT NULL DEFAULT 'emotional_support'",
        "completed_at": "DATETIME NULL",
    }

    with database.engine.begin() as conn:
        for column_name, column_def in mission_columns.items():
            exists = conn.execute(text("SHOW COLUMNS FROM GUARDIAN_MISSIONS LIKE :column_name"), {"column_name": column_name}).first()
            if not exists:
                conn.execute(text(f"ALTER TABLE GUARDIAN_MISSIONS ADD COLUMN {column_name} {column_def}"))


try:
    ensure_mission_schema()
except Exception as e:
    print(f"guardian mission schema check skipped: {e}")


def calculate_pregnancy_week(start_date):
    if not start_date:
        return 0
    diff_days = (date.today() - start_date).days
    return max(0, diff_days // 7)


def get_recommendation_profile(week: int):
    if week <= 12:
        return {
            "range": "1~12주",
            "fetal_size": "자두~라임",
            "fetal_weight": "개인차 큼",
            "highlight": "주요 기관 형성과 초기 영양 관리가 중요한 시기입니다.",
            "source_note": "질병관리청 임산부 식이영양, ACOG 임신 중 영양 자료 기준",
            "foods": [
                "엽산: 시금치·브로콜리·콩류",
                "단백질: 달걀·두부·살코기",
                "입덧 시: 크래커·토스트처럼 부담 적은 음식",
                "수분: 물을 조금씩 자주",
            ],
            "activities": ["무리 없는 짧은 산책", "가벼운 호흡 운동", "피로하면 휴식 우선"],
            "warnings": ["술·흡연 피하기", "날생선·덜 익힌 음식 피하기", "복용 약은 의료진 확인", "심한 복통·출혈은 병원 연락"],
            "contents": [
                ("초기에는 엽산과 약 복용 확인이 우선", "임신 초기 영양과 복용 중인 약을 점검하세요", "🧬", ["엽산 섭취 여부 확인", "복용 중인 약·영양제 산부인과 확인", "술·흡연·날음식 피하기"]),
                ("입덧이 심하면 먹는 방식부터 바꾸기", "소량씩 자주 먹고 수분을 나누어 섭취하세요", "🍵", ["냄새 강한 음식 피하기", "크래커·토스트처럼 부담 적은 음식 활용", "물도 못 마시면 병원 문의"]),
                ("첫 산전검사 일정 정리", "검사 날짜와 병원 안내사항을 한곳에 모으세요", "📋", ["초음파·혈액검사 일정 확인", "마지막 생리 시작일 기록", "궁금한 증상 메모"]),
            ],
            "checklists": [
                ("초기 산전검사 준비", "첫 검진 전 확인할 항목", "🧾", "서울아산병원 산전검사", ["마지막 생리 시작일 기록", "복용 중인 약·영양제 목록", "출혈·복통 여부 메모"]),
                ("입덧 관리 체크", "먹고 마시는 패턴을 점검하세요", "🍵", "질병관리청 임산부 식이영양", ["소량씩 자주 먹기", "수분을 조금씩 나누기", "물도 못 마시면 병원 문의"]),
                ("초기 생활습관 점검", "태아 발달 초기 위험요인을 줄이세요", "🚭", "질병관리청 국가건강정보포털", ["술 피하기", "흡연·간접흡연 피하기", "날음식·덜 익힌 음식 피하기"]),
            ],
            "risk_contents": [
                ("초기 출혈과 심한 복통", "가볍게 넘기지 말아야 할 신호", "🚨", "산모 안전 일반 원칙", ["질 출혈", "심한 복통", "어지러움 동반 통증"]),
                ("심한 입덧과 탈수", "수분 섭취가 안 되면 확인이 필요합니다", "💧", "질병관리청 임산부 식이영양", ["물도 못 마심", "소변량 감소", "계속 토함"]),
                ("약 복용 전 확인", "임신 초기는 임의 복용을 피하세요", "💊", "산전관리 일반 원칙", ["감기약·진통제 임의 복용 금지", "기존 약 의료진 확인", "영양제 중복 확인"]),
            ],
        }
    if week <= 20:
        return {
            "range": "13~20주",
            "fetal_size": "아보카도~바나나",
            "fetal_weight": "약 100~300g대",
            "highlight": "태아 움직임과 산모 체형 변화가 점점 뚜렷해지는 시기입니다.",
            "source_note": "질병관리청 신체활동 정보, ACOG 임신 중 운동 자료 기준",
            "foods": ["철분: 살코기·콩류·녹색 채소", "칼슘: 우유·요거트·두부", "비타민 C: 과일·채소", "단백질 식품 매끼 조금씩"],
            "activities": ["걷기 10~20분부터", "가벼운 산전 스트레칭", "오래 앉아 있으면 중간중간 자세 바꾸기"],
            "warnings": ["숨이 너무 차면 중단", "배를 강하게 압박하는 자세 피하기", "어지러움·흉통·출혈 시 운동 중단"],
            "contents": [
                ("가벼운 활동을 생활 루틴에 넣기", "정상 임신이라면 짧은 걷기부터 시작할 수 있어요", "🚶", ["숨이 너무 차지 않는 강도", "운동 전후 물 마시기", "통증·출혈·어지러움이면 중단"]),
                ("철분과 단백질 챙기기", "태아 성장과 혈액량 증가를 고려하세요", "🩸", ["살코기·달걀·콩류", "녹색 채소와 과일", "어지러움 지속 시 빈혈 확인"]),
                ("태동 시작은 개인차가 큼", "처음 느끼는 시점이 늦어도 바로 이상은 아닐 수 있어요", "👶", ["주수와 태동 느낌 기록", "정기검진에서 질문", "통증·출혈 동반 시 병원 문의"]),
            ],
            "checklists": [
                ("중기 영양 체크", "철분·단백질·칼슘을 챙기세요", "🥚", "질병관리청 임산부 식이영양", ["단백질 식품 포함", "철분 식품 포함", "칼슘 식품 포함"]),
                ("운동 시작 전 체크", "안전하게 움직이기 위한 기준", "🚶", "ACOG 임신 중 운동", ["의료진 제한 여부 확인", "숨이 너무 차면 중단", "운동 전후 물 마시기"]),
                ("태동 기록 준비", "느낌과 시간을 가볍게 기록하세요", "👶", "ACOG 태아 발달", ["처음 느낀 시기", "활동 많은 시간대", "평소와 다른 변화"]),
            ],
            "risk_contents": [
                ("운동 중 중단 신호", "무리하면 바로 멈추세요", "⚠️", "ACOG 임신 중 운동", ["질출혈", "흉통·어지러움", "규칙적 자궁수축"]),
                ("빈혈 의심 증상", "어지러움이 지속되면 확인하세요", "🩸", "서울대학교병원 의학정보", ["지속 피로", "어지러움", "숨참"]),
                ("통증·출혈 동반 태동", "태동 자체보다 동반 증상이 중요합니다", "🚨", "산모 안전 일반 원칙", ["출혈", "심한 복통", "양수 의심"]),
            ],
        }
    if week <= 28:
        return {
            "range": "21~28주",
            "fetal_size": "파파야~가지",
            "fetal_weight": "약 500g~1kg 전후",
            "highlight": "정밀초음파와 임신당뇨 검사 등 산전검사 관리가 중요해지는 시기입니다.",
            "source_note": "서울아산병원 산전검사, 질병관리청 임산부 영양, ACOG 자료 기준",
            "foods": ["철분과 단백질 식품", "칼슘·비타민 D 식품", "오메가3 생선은 안전한 종류로", "카페인은 하루 총량 확인"],
            "activities": ["중강도 걷기", "수영 또는 수중운동", "옆으로 누워 쉬는 습관"],
            "warnings": ["태동이 확 줄면 병원 연락", "수은 높은 생선 과다 섭취 피하기", "규칙적 배뭉침·출혈·양수 의심 시 연락"],
            "contents": [
                ("정밀초음파와 임신당뇨 검사 준비", "검사 일정과 안내사항을 미리 확인하세요", "🧪", ["검사 날짜 캘린더 저장", "검사 전 주의사항 확인", "결과 설명 메모"]),
                ("카페인은 총량으로 계산", "커피 외 음료의 카페인도 함께 봐야 합니다", "☕", ["커피·녹차·홍차·콜라 합산", "오후 늦은 카페인 줄이기", "수면 방해 여부 확인"]),
                ("옆으로 눕는 수면 자세 연습", "중기 이후에는 바로 눕는 자세가 불편할 수 있어요", "😴", ["무릎 사이 베개 활용", "배 아래 받침 사용", "어지러우면 자세 바꾸기"]),
            ],
            "checklists": [
                ("정밀초음파 체크", "검사 전후 확인할 내용", "🧪", "서울아산병원 산전검사", ["검사 날짜 확인", "결과 설명 메모", "추가검사 여부 확인"]),
                ("임신당뇨 검사 체크", "혈당 검사 전후 관리", "📊", "질병관리청 임신당뇨병", ["검사 전 안내사항 확인", "결과 수치 메모", "식사·운동 지시 확인"]),
                ("수면 자세 체크", "중기 이후 편한 자세 만들기", "🛏️", "ACOG 수면 자세", ["옆으로 눕기", "무릎 사이 베개", "어지러우면 자세 변경"]),
            ],
            "risk_contents": [
                ("태동 감소", "평소보다 확 줄면 바로 확인하세요", "👶", "ACOG 태아 발달", ["움직임이 확 줄어듦", "휴식 후에도 변화 없음", "불안하면 병원 문의"]),
                ("양수 의심", "물이 새는 느낌은 확인이 필요합니다", "🌊", "서울아산병원 조산 정보", ["물처럼 흐름", "속옷이 반복적으로 젖음", "냄새와 색 변화"]),
                ("규칙적 배뭉침", "반복 간격이 있으면 병원에 문의하세요", "⏱️", "서울아산병원 조산 정보", ["규칙적 간격", "점점 강해짐", "출혈 동반"]),
            ],
        }
    if week <= 36:
        return {
            "range": "29~36주",
            "fetal_size": "호박~멜론",
            "fetal_weight": "약 1.2~2.6kg 전후",
            "highlight": "태아 성장과 산모의 붓기, 허리 부담, 수면 불편이 커질 수 있는 시기입니다.",
            "source_note": "질병관리청 임신고혈압 정보, ACOG 운동 중단 신호 기준",
            "foods": ["저염식으로 붓기 부담 줄이기", "수분은 낮부터 나누어 섭취", "소량씩 자주 식사", "철분·단백질 꾸준히"],
            "activities": ["짧은 산책", "골반 주변 가벼운 스트레칭", "다리 올리고 쉬기"],
            "warnings": ["갑작스러운 심한 부종·두통 주의", "오래 서 있기 피하기", "숨참·흉통·실신 느낌은 즉시 도움 요청"],
            "contents": [
                ("붓기와 혈압 관련 증상 구분", "갑작스러운 심한 부종은 확인이 필요합니다", "🦶", ["두통·시야 흐림 동반 여부", "오른쪽 윗배 통증 확인", "갑작스러운 얼굴·손 부종 주의"]),
                ("출산가방과 병원 연락처 정리", "급할 때 바로 움직일 수 있게 준비하세요", "🎒", ["산모수첩·신분증", "병원·보호자 연락처", "이동 수단 확인"]),
                ("태동 패턴을 평소 기준으로 기억", "평소보다 확 줄면 바로 확인해야 합니다", "🤲", ["활동 많은 시간대 기억", "태동 감소 느낌 기록", "확실히 줄면 병원 문의"]),
            ],
            "checklists": [
                ("출산가방 체크", "급할 때 바로 들고 갈 수 있게 준비하세요", "🎒", "산전관리 일반 원칙", ["산모수첩·신분증", "개인 위생용품", "아기 퇴원용품"]),
                ("부종·혈압 체크", "붓기와 동반 증상을 같이 보세요", "🦶", "질병관리청 임신고혈압", ["얼굴·손 부종", "두통·시야 흐림", "오른쪽 윗배 통증"]),
                ("병원 연락처 체크", "야간에도 바로 연락 가능하게 준비하세요", "📞", "산전관리 일반 원칙", ["분만 병원 번호", "보호자 연락 순서", "이동 수단"]),
            ],
            "risk_contents": [
                ("임신고혈압 의심", "두통과 시야 이상은 중요 신호입니다", "⚠️", "질병관리청 임신고혈압", ["심한 두통", "시야 흐림", "오른쪽 윗배 통증"]),
                ("조산 의심", "37주 전 규칙적 통증은 확인이 필요합니다", "⏱️", "서울아산병원 조산 정보", ["규칙적 진통", "골반 압박감", "질출혈·분비물 증가"]),
                ("호흡곤란·흉통", "응급 확인이 필요한 증상입니다", "🏥", "산모 안전 일반 원칙", ["숨쉬기 어려움", "가슴 통증", "실신 느낌"]),
            ],
        }
    return {
        "range": "37~40주" if week <= 40 else "40주 이후",
        "fetal_size": "수박",
        "fetal_weight": "약 2.8kg 이상 개인차",
        "highlight": "분만 신호와 태동 변화를 가장 우선해서 확인해야 하는 시기입니다.",
        "source_note": "서울아산병원 조산·산전검사 정보, ACOG 태동·운동 안전 기준",
        "foods": ["소화 잘 되는 식사", "수분 충분히", "변비 예방 식이섬유", "무리한 보양식보다 균형식"],
        "activities": ["가벼운 걷기", "호흡 이완", "출산가방·병원 연락처 확인"],
        "warnings": ["규칙적 진통은 병원 연락", "양수 의심·출혈 시 즉시 연락", "태동 감소는 바로 확인", "예정일 이후 진료 일정 우선"],
        "contents": [
            ("분만 신호는 병원 연락이 먼저", "규칙적 진통, 양수, 출혈은 바로 확인하세요", "🏥", ["진통 간격 기록", "물이 새는 느낌 확인", "출혈 있으면 바로 연락"]),
            ("응급 연락 체계 최종 확인", "분만 병원과 이동 계획을 바로 볼 수 있게 정리하세요", "📞", ["분만 병원 번호", "보호자 연락 순서", "야간 이동 방법"]),
            ("막달에도 태동 감소는 중요", "아기가 덜 움직인다고 느끼면 기다리지 마세요", "👶", ["평소와 다른 감소 확인", "휴식 후에도 감소하면 연락", "앱 답변보다 병원 우선"]),
        ],
        "checklists": [
            ("분만 신호 체크", "연락해야 할 기준을 미리 정리하세요", "🏥", "서울아산병원 분만 관련 정보", ["규칙적 진통", "양수 의심", "출혈"]),
            ("막달 이동 준비", "바로 병원에 갈 수 있게 준비하세요", "🚗", "산전관리 일반 원칙", ["가방 위치", "차량·택시 계획", "병원 연락처"]),
            ("예정일 이후 체크", "담당의 추적 계획을 우선하세요", "📋", "산전관리 일반 원칙", ["검진 예약", "태동 변화", "유도분만 상담 여부"]),
        ],
        "risk_contents": [
            ("태동 감소", "막달에도 태동 감소는 바로 확인하세요", "👶", "ACOG 태아 발달", ["평소보다 확 줄어듦", "휴식 후에도 감소", "불안하면 병원 연락"]),
            ("양수·출혈", "분만 또는 응급 신호일 수 있습니다", "🌊", "서울아산병원 산전관리", ["물이 흐름", "선홍색 출혈", "복통 동반"]),
            ("응급 증상", "앱보다 119 또는 응급실이 먼저입니다", "🚨", "산모 안전 일반 원칙", ["호흡곤란", "흉통", "실신"]),
        ],
    }


def ensure_ai_recommendation_seed():
    with database.SessionLocal() as db:
        def add_if_missing(week, recommendation_type, title, content):
            existing = db.query(models.WeeklyAiRecommendation).filter(
                models.WeeklyAiRecommendation.pregnancy_week == week,
                models.WeeklyAiRecommendation.recommendation_type == recommendation_type,
                models.WeeklyAiRecommendation.title == title,
            ).first()
            if not existing:
                db.add(models.WeeklyAiRecommendation(
                    pregnancy_week=week,
                    recommendation_type=recommendation_type,
                    title=title,
                    content=content,
                ))

        for week in range(1, 41):
            profile = get_recommendation_profile(week)
            add_if_missing(
                week,
                "META",
                profile["range"],
                json.dumps({
                    "range": profile["range"],
                    "fetalSize": profile["fetal_size"],
                    "fetalWeight": profile["fetal_weight"],
                    "highlight": profile["highlight"],
                    "sourceNote": profile["source_note"],
                }, ensure_ascii=False),
            )
            for item in profile["foods"]:
                add_if_missing(week, "FOOD", item, item)
            for item in profile["activities"]:
                add_if_missing(week, "ACTIVITY", item, item)
            for item in profile["warnings"]:
                add_if_missing(week, "WARNING", item, item)
            for title, subtitle, emoji, bullets in profile["contents"]:
                add_if_missing(week, "CONTENT_WEEKLY", title, json.dumps({"subtitle": subtitle, "emoji": emoji, "source": profile["source_note"], "bullets": bullets}, ensure_ascii=False))
            for title, subtitle, emoji, source, bullets in profile["checklists"]:
                add_if_missing(week, "CONTENT_CHECKLIST", title, json.dumps({"subtitle": subtitle, "emoji": emoji, "source": source, "bullets": bullets}, ensure_ascii=False))
            for title, subtitle, emoji, source, bullets in profile["risk_contents"]:
                add_if_missing(week, "CONTENT_WARNING", title, json.dumps({"subtitle": subtitle, "emoji": emoji, "source": source, "bullets": bullets}, ensure_ascii=False))

        db.commit()


try:
    ensure_ai_recommendation_seed()
except Exception as e:
    print(f"weekly ai recommendation seed skipped: {e}")

app = FastAPI(title="Pregnancy Smart Care API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=BACKEND_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "FastAPI backend",
        "api_public_base_url": API_PUBLIC_BASE_URL,
    }


# =====================================================================
# 🤖 2. AI 감정 분석 모델 적재
# =====================================================================
print("🚀 AI 감정 분석 모델을 메모리에 적재 중입니다...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

possible_paths = [
    os.path.join(ROOT_DIR, "Project", "diary_emotion_ai", "scripts"),
    os.path.join(ROOT_DIR, "diary_emotion_ai", "scripts")
]

ai_scripts_path = None
for p in possible_paths:
    if os.path.exists(p):
        ai_scripts_path = p
        break

if ai_scripts_path:
    if ai_scripts_path not in sys.path:
        sys.path.append(ai_scripts_path)
    try:
        diary_ai = importlib.import_module("03_predict_diary_emotion")
        AI_MODEL = json.loads(diary_ai.MODEL_PATH.read_text(encoding="utf-8"))
        print("✅ AI 모델 적재 완료! (추론 대기 상태)")
    except Exception as e:
        print(f"❌ AI 모델 로드 실패: {e}")
else:
    print(f"❌ AI 스크립트 경로를 찾지 못했습니다. (현재 검색 경로: {possible_paths})")


# =====================================================================
# 📦 3. 데이터 검증용 스키마 (Pydantic Models)
# =====================================================================
class CommentCreate(BaseModel):
    user_id: int
    content: str

class EmotionRequest(BaseModel):
    text: str

class EventCreate(BaseModel):
    connection_code: str
    event_type: str
    title: str
    content: str
    event_date: date

class EventUpdate(BaseModel):
    event_type: str
    title: str
    content: str
    event_date: date

class PostCreate(BaseModel):
    user_id: int
    pregnancy_period: str
    title: str
    content: str


# =====================================================================
# 🔐 4. 계정 및 프로필 API
# =====================================================================
@app.post("/api/auth/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    parent_user_id = None
    if user.role == "PREGNANT":
        while True:
            new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not db.query(models.User).filter(models.User.connection_code == new_code).first():
                connection_code = new_code
                break
    else: 
        connection_code = None
        pregnant_user = db.query(models.User).filter(models.User.connection_code == user.input_connection_code).first()
        if not pregnant_user:
            raise HTTPException(status_code=400, detail="유효하지 않은 인증코드입니다.")
        parent_user_id = pregnant_user.id

    new_user = models.User(
        email=user.email,
        password=user.password,
        name=user.name,
        role=user.role,
        baby_nickname=user.baby_nickname,
        pregnancy_start_date=datetime.strptime(user.start_date, "%Y-%m-%d").date() if user.start_date else None,
        connection_code=connection_code,
        parent_user_id=parent_user_id
    )
    db.add(new_user)
    db.flush() 
    
    if user.role == "GUARDIAN" and parent_user_id:
        pregnant_user = db.query(models.User).filter(models.User.id == parent_user_id).first()
        if pregnant_user:
            pregnant_user.parent_user_id = new_user.id
    
    db.commit()
    return {"status": "Success", "connection_code": connection_code}

@app.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다.")
    
    pregnant_info = None
    guardian_info = None
    
    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            pregnant_info = {
                "name": parent.name,
                "baby_nickname": parent.baby_nickname,
                "pregnancy_start_date": str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None,
                "connection_code": parent.connection_code
            }
    elif user.role == "PREGNANT" and user.parent_user_id:
        guardian = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if guardian:
            guardian_info = {
                "name": guardian.name,
                "email": guardian.email
            }
    
    return {
        "status": "Success",
        "user": {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "baby_nickname": user.baby_nickname,
            "pregnancy_start_date": str(user.pregnancy_start_date) if user.pregnancy_start_date else None,
            "connection_code": user.connection_code,
            "parent_user_id": user.parent_user_id,
            "connected_pregnant": pregnant_info,
            "connected_guardian": guardian_info
        }
    }

@app.get("/api/user/info/{identifier}")
def get_user_info(identifier: str, db: Session = Depends(database.get_db)):
    if identifier.isdigit():
        user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    partner_code = None
    pregnant_start_date = str(user.pregnancy_start_date) if user.pregnancy_start_date else None
    connected_name = None
    connected_email = None

    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            partner_code = parent.connection_code
            pregnant_start_date = str(parent.pregnancy_start_date) if parent.pregnancy_start_date else None
            connected_name = parent.name
            connected_email = parent.email
    elif user.role == "PREGNANT" and user.parent_user_id:
        guardian = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if guardian:
            connected_name = guardian.name
            connected_email = guardian.email

    return {
        "status": "Success",
        "user_id": user.id,
        "name": user.name,
        "baby_nickname": user.baby_nickname,
        "connection_code": user.connection_code,
        "partner_code": partner_code,
        "pregnancy_start_date": pregnant_start_date,
        "connected_name": connected_name,
        "connected_email": connected_email
    }


def parse_recommendation_content(content: str):
    try:
        return json.loads(content)
    except Exception:
        return {"subtitle": content, "emoji": "📌", "source": "WEEKLY_AI_RECOMMENDATIONS", "bullets": [content]}


def format_content_recommendation(row, content_type: str):
    parsed = parse_recommendation_content(row.content)
    return {
        "id": int(row.recommendation_id),
        "type": content_type,
        "emoji": parsed.get("emoji", "📌"),
        "title": row.title,
        "subtitle": parsed.get("subtitle", ""),
        "source": parsed.get("source", ""),
        "bullets": parsed.get("bullets", []),
    }


def unique_content_rows(rows, limit=3):
    result = []
    seen_titles = set()
    for row in rows:
        if row.title in seen_titles:
            continue
        seen_titles.add(row.title)
        result.append(row)
        if len(result) >= limit:
            break
    return result


def unique_titles(rows, fallback_items=None, limit=None):
    result = []
    seen_titles = set()
    for row in rows:
        title = row.title
        if title in seen_titles:
            continue
        seen_titles.add(title)
        result.append(title)
        if limit and len(result) >= limit:
            return result

    for title in fallback_items or []:
        if title in seen_titles:
            continue
        seen_titles.add(title)
        result.append(title)
        if limit and len(result) >= limit:
            break
    return result


def filter_rows_by_titles(rows, expected_titles):
    expected = set(expected_titles)
    return [row for row in rows if row.title in expected]


def profile_content_items(items, content_type, source_note=None, id_offset=0):
    result = []
    for index, item in enumerate(items):
        if len(item) == 4:
            title, subtitle, emoji, bullets = item
            source = source_note or "공식 임신 건강정보"
        else:
            title, subtitle, emoji, source, bullets = item
        result.append({
            "id": id_offset + index,
            "type": content_type,
            "emoji": emoji,
            "title": title,
            "subtitle": subtitle,
            "source": source,
            "bullets": bullets,
        })
    return result


def content_group_from_rows(rows, expected_items, content_type, source_note=None, id_offset=0):
    expected_titles = [item[0] for item in expected_items]
    filtered = unique_content_rows(filter_rows_by_titles(rows, expected_titles), limit=len(expected_items))
    if len(filtered) >= len(expected_items):
        return [format_content_recommendation(row, content_type) for row in filtered]
    return profile_content_items(expected_items, content_type, source_note, id_offset)


@app.get("/api/ai/weekly-recommendations/{identifier}")
def get_weekly_ai_recommendations(identifier: str, db: Session = Depends(database.get_db)):
    if identifier.isdigit():
        user = db.query(models.User).filter(models.User.id == int(identifier)).first()
    else:
        user = db.query(models.User).filter(models.User.email == identifier).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user = user
    if user.role == "GUARDIAN" and user.parent_user_id:
        parent = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
        if parent:
            target_user = parent

    pregnancy_week = calculate_pregnancy_week(target_user.pregnancy_start_date)
    query_week = min(max(pregnancy_week, 1), 40)
    profile = get_recommendation_profile(query_week)
    rows = db.query(models.WeeklyAiRecommendation).filter(
        models.WeeklyAiRecommendation.pregnancy_week == query_week
    ).all()

    if not rows:
        ensure_ai_recommendation_seed()
        rows = db.query(models.WeeklyAiRecommendation).filter(
            models.WeeklyAiRecommendation.pregnancy_week == query_week
        ).all()

    grouped = {}
    for row in rows:
        grouped.setdefault(row.recommendation_type, []).append(row)

    meta_rows = filter_rows_by_titles(grouped.get("META", []), [profile["range"]])
    meta_row = meta_rows[0] if meta_rows else None
    meta = parse_recommendation_content(meta_row.content) if meta_row else {
        "range": profile["range"],
        "fetalSize": profile["fetal_size"],
        "fetalWeight": profile["fetal_weight"],
        "highlight": profile["highlight"],
        "sourceNote": profile["source_note"],
    }
    food_rows = filter_rows_by_titles(grouped.get("FOOD", []), profile["foods"])
    activity_rows = filter_rows_by_titles(grouped.get("ACTIVITY", []), profile["activities"])
    warning_rows = filter_rows_by_titles(grouped.get("WARNING", []), profile["warnings"])

    return {
        "status": "Success",
        "user_id": target_user.id,
        "baby_nickname": target_user.baby_nickname,
        "pregnancy_start_date": str(target_user.pregnancy_start_date) if target_user.pregnancy_start_date else None,
        "pregnancy_week": pregnancy_week,
        "query_week": query_week,
        "guide": {
            "range": meta.get("range"),
            "fetalSize": meta.get("fetalSize"),
            "fetalWeight": meta.get("fetalWeight"),
            "highlight": meta.get("highlight"),
            "foods": unique_titles(food_rows, profile["foods"]),
            "activities": unique_titles(activity_rows, profile["activities"]),
            "warnings": unique_titles(warning_rows, profile["warnings"]),
            "sourceNote": meta.get("sourceNote"),
        },
        "contents": {
            "weekly": content_group_from_rows(grouped.get("CONTENT_WEEKLY", []), profile["contents"], "이번 주", profile["source_note"], 1000),
            "checklist": content_group_from_rows(grouped.get("CONTENT_CHECKLIST", []), profile["checklists"], "체크리스트", None, 2000),
            "warning": content_group_from_rows(grouped.get("CONTENT_WARNING", []), profile["risk_contents"], "위험신호", None, 3000),
        },
    }

@app.put("/api/user/profile/{user_id}")
def update_profile(user_id: int, profile: schemas.ProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.name = profile.name
    user.baby_nickname = profile.baby_nickname
    db.commit()
    return {"status": "Success", "message": "프로필이 수정되었습니다."}

@app.put("/api/user/password/{user_id}")
def update_password(user_id: int, passwords: schemas.PasswordUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if user.password != passwords.current_password:
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")
    user.password = passwords.new_password
    db.commit()
    return {"status": "Success", "message": "비밀번호가 변경되었습니다."}

@app.delete("/api/auth/withdraw/{user_id}")
def withdraw_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    try:
        if user.role == "PREGNANT":
            if user.parent_user_id:
                guardian = db.query(models.User).filter(models.User.id == user.parent_user_id).first()
                if guardian:
                    db.query(models.CommunityPost).filter(models.CommunityPost.user_id == guardian.id).delete()
                    db.query(models.CommunityComment).filter(models.CommunityComment.user_id == guardian.id).delete()
                    db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == guardian.id).delete()
                    db.delete(guardian)
            
            diary_logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).all()
            for log in diary_logs:
                db.query(models.AiAnalysisResult).filter(models.AiAnalysisResult.diary_id == log.diary_id).delete()
            db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).delete()
            db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).delete()
            db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).delete()
            db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == user_id).delete()
            if user.connection_code:
                db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.connection_code == user.connection_code).delete()
            db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == user_id).delete()
            db.delete(user)
        elif user.role == "GUARDIAN":
            db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).delete()
            db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).delete()
            db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.user_id == user_id).delete()
            db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == user_id).delete()
            db.delete(user)
        db.commit()
        return {"status": "Success", "message": "회원탈퇴가 완료되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"탈퇴 중 오류 발생: {str(e)}")


# =====================================================================
# 🏠 5. 스마트홈(가전 제어) API (🚀 가족 연동 동기화 수문장)
# =====================================================================
def get_family_master_id(user_id: int, db: Session):
    """보호자가 요청하더라도 임산부의 ID를 반환하여 데이터베이스를 하나로 공유합니다."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role.upper() == "GUARDIAN" and user.parent_user_id:
        return user.parent_user_id
    return user_id

@app.post("/api/appliances/bulk")
def update_appliances_bulk(payload: schemas.ApplianceSettingsBulkUpsert, db: Session = Depends(database.get_db)):
    try:
        master_id = get_family_master_id(payload.user_id, db)
        for item in payload.settings:
            setting = db.query(models.ApplianceSetting).filter(
                models.ApplianceSetting.user_id == master_id,
                models.ApplianceSetting.appliance_name == item.appliance_name
            ).first()
            if setting:
                setting.control_command = item.control_command
                setting.execution_status = item.execution_status
            else:
                new_setting = models.ApplianceSetting(
                    user_id=master_id,
                    appliance_name=item.appliance_name,
                    control_command=item.control_command,
                    execution_status=item.execution_status
                )
                db.add(new_setting)
        db.commit()
        return {"status": "Success", "message": "가족 연동 가전 설정이 저장되었습니다!"}
    except Exception as e:
        db.rollback()
        return {"status": "Error", "message": str(e)}

@app.get("/api/appliances/{user_id}")
def get_user_appliances(user_id: int, db: Session = Depends(database.get_db)):
    try:
        master_id = get_family_master_id(user_id, db)
        settings = db.query(models.ApplianceSetting).filter(models.ApplianceSetting.user_id == master_id).all()
        result = []
        for s in settings:
            result.append({
                "appliance_name": s.appliance_name,
                "control_command": s.control_command,
                "execution_status": s.execution_status
            })
        return {"status": "Success", "settings": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 📖 6. 다이어리 & AI 감정 분석 API
# =====================================================================
def get_guardian_for_pregnant_user(pregnant_user_id: int, db: Session):
    pregnant_user = db.query(models.User).filter(models.User.id == pregnant_user_id).first()
    if not pregnant_user:
        return None

    if pregnant_user.parent_user_id:
        guardian = db.query(models.User).filter(
            models.User.id == pregnant_user.parent_user_id,
            func.upper(models.User.role) == "GUARDIAN"
        ).first()
        if guardian:
            return guardian

    return db.query(models.User).filter(
        models.User.parent_user_id == pregnant_user_id,
        func.upper(models.User.role) == "GUARDIAN"
    ).first()


def get_or_create_care_preference(user_id: int, db: Session):
    preference = db.query(models.UserCarePreference).filter(models.UserCarePreference.user_id == user_id).first()
    if preference:
        return preference

    preference = models.UserCarePreference(user_id=user_id)
    db.add(preference)
    db.flush()
    return preference


def classify_mission_context(emotion: str, diary_content: str):
    text = f"{emotion or ''} {diary_content or ''}"
    if any(keyword in text for keyword in ["입덧", "메스꺼", "토할", "소화", "속이", "울렁"]):
        return "physical_care", "속이 불편한 상태"
    if any(keyword in text for keyword in ["허리", "통증", "붓기", "다리", "배가", "피로", "힘들", "잠"]):
        return "housework", "몸이 무겁거나 피로한 상태"
    if any(keyword in text for keyword in ["불안", "우울", "슬픔", "무서", "걱정", "화남", "스트레스"]):
        return "emotional_support", "정서적 지지가 필요한 상태"
    if emotion in ["불안", "우울", "화남", "피로"]:
        return "emotional_support", f"{emotion} 감정이 감지된 상태"
    if emotion in ["행복", "안정", "설렘"]:
        return "positive", f"{emotion} 감정이 감지된 상태"
    return "balanced", "특별한 위험 신호는 없지만 관심이 필요한 상태"


def build_guardian_mission(emotion: str, diary_content: str, preference):
    mission_type, reason_context = classify_mission_context(emotion, diary_content)

    if preference and preference.preferred_mission_type != "balanced":
        mission_type = preference.preferred_mission_type

    missions = {
        "physical_care": {"title": "몸 상태를 먼저 살피는 미션", "content": "따뜻한 물이나 부담 없는 간식을 준비하고, 실내를 환기한 뒤 아내가 바로 쉴 수 있게 해주세요."},
        "housework": {"title": "집안 부담을 줄이는 미션", "content": "오늘은 설거지, 빨래, 바닥 정리 중 하나를 먼저 끝내고 아내에게 쉬라고 말해주세요."},
        "emotional_support": {"title": "마음을 안정시키는 미션", "content": "해결책을 먼저 말하지 말고 10분 동안 아내의 이야기를 끊지 않고 들어주세요."},
        "conversation": {"title": "대화를 여는 미션", "content": "오늘 가장 힘들었던 순간과 도와줬으면 하는 일을 차분하게 물어봐 주세요."},
        "positive": {"title": "좋은 컨디션을 유지하는 미션", "content": "가벼운 산책이나 좋아하는 간식을 제안해서 좋은 기분이 이어지도록 도와주세요."},
        "balanced": {"title": "오늘의 기본 케어 미션", "content": "아내에게 오늘 컨디션을 물어보고 물 한 잔과 짧은 휴식 시간을 챙겨주세요."},
    }

    selected = missions.get(mission_type, missions["balanced"])
    content = selected["content"]
    care_style = preference.care_style if preference else "warm"
    if care_style == "practical":
        content = content.replace("말해주세요", "전달하고 바로 실행해주세요")
    elif care_style == "short":
        content = content.split(".")[0] + "."

    avoid_keywords = []
    if preference and preference.avoid_mission_keywords:
        avoid_keywords = [item.strip() for item in preference.avoid_mission_keywords.split(",") if item.strip()]
    if any(keyword in content for keyword in avoid_keywords):
        mission_type = "balanced"
        selected = missions["balanced"]
        content = selected["content"]

    return {
        "mission_type": mission_type,
        "mission_title": selected["title"],
        "mission_content": content,
        "mission_reason": f"오늘 기록에서 {reason_context}로 판단되어 이 미션을 추천했습니다.",
    }


def create_guardian_mission_for_status_check(db: Session, pregnant_user_id: int, status_check_id: int, symptoms: list[str], emotions: list[str]):
    guardian = get_guardian_for_pregnant_user(pregnant_user_id, db)
    if not guardian:
        return None

    existing = db.query(models.GuardianMission).filter(
        models.GuardianMission.status_check_id == status_check_id,
        models.GuardianMission.user_id == guardian.id
    ).first()
    if existing:
        return existing

    preference = get_or_create_care_preference(guardian.id, db)
    primary_emotion = emotions[0] if emotions else "중립"
    status_text = " ".join((symptoms or []) + (emotions or []))
    mission_data = build_guardian_mission(primary_emotion, status_text, preference)
    mission = models.GuardianMission(
        status_check_id=status_check_id,
        user_id=guardian.id,
        mission_title=mission_data["mission_title"],
        mission_content=mission_data["mission_content"],
        mission_reason=mission_data["mission_reason"],
        mission_type=mission_data["mission_type"],
        execution_status="PENDING",
    )
    db.add(mission)
    db.flush()
    return mission


def format_guardian_mission(mission):
    if not mission:
        return None
    return {
        "mission_id": mission.mission_id,
        "analysis_id": mission.analysis_id,
        "status_check_id": mission.status_check_id,
        "mission_title": mission.mission_title,
        "mission_content": mission.mission_content,
        "mission_reason": mission.mission_reason,
        "mission_type": mission.mission_type,
        "execution_status": mission.execution_status,
        "created_at": mission.created_at.isoformat() if mission.created_at else None,
        "completed_at": mission.completed_at.isoformat() if mission.completed_at else None,
    }


@app.post("/api/status-checks")
def create_status_check(payload: schemas.PregnancyStatusCheckCreate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role.upper() != "PREGNANT":
        raise HTTPException(status_code=400, detail="임산부 계정만 상태 체크를 등록할 수 있습니다.")

    status_check = models.PregnancyStatusCheck(
        user_id=payload.user_id,
        symptoms=json.dumps(payload.symptoms, ensure_ascii=False),
        emotions=json.dumps(payload.emotions, ensure_ascii=False),
    )
    db.add(status_check)
    db.flush()

    mission = create_guardian_mission_for_status_check(
        db=db,
        pregnant_user_id=payload.user_id,
        status_check_id=status_check.status_check_id,
        symptoms=payload.symptoms,
        emotions=payload.emotions,
    )
    db.commit()

    return {
        "status": "Success",
        "status_check_id": status_check.status_check_id,
        "guardian_mission": format_guardian_mission(mission),
    }


@app.get("/api/guardian/missions/today/{guardian_user_id}")
def get_today_guardian_mission(guardian_user_id: int, db: Session = Depends(database.get_db)):
    mission = db.query(models.GuardianMission).filter(
        models.GuardianMission.user_id == guardian_user_id,
        func.date(models.GuardianMission.created_at) == date.today()
    ).order_by(models.GuardianMission.created_at.desc()).first()

    return {"status": "Success", "mission": format_guardian_mission(mission)}


@app.put("/api/guardian/missions/{mission_id}/complete")
def complete_guardian_mission(mission_id: int, db: Session = Depends(database.get_db)):
    mission = db.query(models.GuardianMission).filter(models.GuardianMission.mission_id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    mission.execution_status = "COMPLETED"
    mission.completed_at = datetime.now()
    db.commit()
    return {"status": "Success", "mission": format_guardian_mission(mission)}


@app.get("/api/guardian/preferences/{guardian_user_id}")
def get_guardian_preferences(guardian_user_id: int, db: Session = Depends(database.get_db)):
    preference = get_or_create_care_preference(guardian_user_id, db)
    db.commit()
    return {
        "status": "Success",
        "preference": {
            "preferred_mission_type": preference.preferred_mission_type,
            "notification_enabled": preference.notification_enabled,
            "mission_time": preference.mission_time,
            "care_style": preference.care_style,
            "avoid_mission_keywords": preference.avoid_mission_keywords,
        }
    }


@app.put("/api/guardian/preferences/{guardian_user_id}")
def update_guardian_preferences(guardian_user_id: int, payload: schemas.UserCarePreferenceUpsert, db: Session = Depends(database.get_db)):
    preference = get_or_create_care_preference(guardian_user_id, db)
    preference.preferred_mission_type = payload.preferred_mission_type or "balanced"
    preference.notification_enabled = bool(payload.notification_enabled)
    preference.mission_time = payload.mission_time
    preference.care_style = payload.care_style or "warm"
    preference.avoid_mission_keywords = payload.avoid_mission_keywords
    db.commit()
    return {"status": "Success"}

@app.post("/api/ai/emotion")
def analyze_diary_emotion(req: EmotionRequest):
    if not req.text.strip():
        return {"status": "Error", "message": "텍스트가 없습니다."}
    try:
        prediction, probabilities = diary_ai.predict(AI_MODEL, req.text)
        emoji_map = {
            "행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐",
            "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"
        }
        return {"status": "Success", "emotion_label": prediction, "emoji": emoji_map.get(prediction, "😐")}
    except Exception as e:
        return {"status": "Error", "message": "AI 오류가 발생했습니다."}

@app.post("/api/diary/logs")
def create_diary_log(
    user_id: int = Form(...),
    selected_emotion: str = Form(...),
    diary_content: str = Form(...),
    detected_emotion: str = Form(None),
    image: UploadFile = File(None),
    date: str = Form(None),
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
            res = requests.get(f"http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid={WEATHER_API_KEY}&lang=kr")
            if res.status_code == 200:
                weather_desc = res.json()['weather'][0]['description']

        reverse_emoji_map = {"😊": "행복", "🙂": "안정", "🥰": "설렘", "😐": "중립", "😟": "불안", "😫": "피로", "😔": "우울", "😡": "화남"}
        db_emotion_text = reverse_emoji_map.get(selected_emotion, selected_emotion)

        dummy_temperature = round(random.uniform(21.0, 26.0), 1)
        dummy_humidity = round(random.uniform(40.0, 60.0), 1)
        
        new_diary = models.DiaryLog(
            user_id=user_id,
            selected_emotion=db_emotion_text,
            diary_content=diary_content,
            image_path=saved_image_path,
            temperature_ambient=dummy_temperature,
            humidity_ambient=dummy_humidity,
            weather_ambient=weather_desc           
        )
        if date:
            new_diary.recorded_at = datetime.strptime(date, "%Y-%m-%d")

        db.add(new_diary)
        db.flush()

        if detected_emotion:
            new_analysis = models.AiAnalysisResult(diary_id=new_diary.diary_id, detected_emotion=detected_emotion)
            db.add(new_analysis)

        db.commit()
        return {"status": "Success", "message": "성공적으로 저장되었습니다."}
    except Exception as e:
        db.rollback() 
        return {"status": "Error", "message": str(e)}


@app.get("/api/diary/logs/{user_id}")
def get_diary_logs(user_id: int, db: Session = Depends(database.get_db)):
    try:
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == user_id).order_by(models.DiaryLog.recorded_at.desc()).all()
        keyword_to_emoji = {"행복": "😊", "안정": "🙂", "설렘": "🥰", "중립": "😐", "불안": "😟", "피로": "😫", "우울": "😔", "화남": "😡"}
        diary_result = []
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        # 🚀 [수정] 양방향 파트너 ID 탐색 로직 적용
        partner_id = None
        if user:
            if user.role == "PREGNANT":
                # 임산부: 나를 parent_user_id로 등록한 보호자를 역추적하여 찾음
                guardian = db.query(models.User).filter(models.User.parent_user_id == user.id).first()
                partner_id = guardian.id if guardian else user.parent_user_id
            else:
                # 보호자: 내 parent_user_id가 파트너(임산부)
                partner_id = user.parent_user_id
        
        for log in logs:
            date_str = str(log.recorded_at).split(" ")[0] if log.recorded_at else "2026-05-26"
            img_list = [f"{API_PUBLIC_BASE_URL}/{log.image_path}"] if log.image_path else []
            display_mood = keyword_to_emoji.get(log.selected_emotion, "😐")
            
            entry = {
                "id": log.diary_id,
                "date": date_str,
                "mood": display_mood,
                "content": log.diary_content,
                "images": img_list,
                "type": "daily"
            }
            
            # 다이어리에 속한 스몰토크 융합
            try:
                from datetime import datetime as dt
                date_obj = dt.strptime(date_str, "%Y-%m-%d").date()
                my_smalltalk = db.query(models.SmallTalkAnswer).filter(
                    models.SmallTalkAnswer.user_id == user_id,
                    func.date(models.SmallTalkAnswer.created_at) == date_obj
                ).first()
                
                if my_smalltalk:
                    # 🚀 [수정] 파트너 답변이 없어도 무조건 출력되도록 기본값 할당
                    partner_ans_content = "아직 답변하지 않았습니다."
                    
                    if partner_id:
                        partner_smalltalk = db.query(models.SmallTalkAnswer).filter(
                            models.SmallTalkAnswer.user_id == partner_id,
                            models.SmallTalkAnswer.topic_id == my_smalltalk.topic_id
                        ).first()
                        
                        if partner_smalltalk:
                            partner_ans_content = partner_smalltalk.answer_content
                            
                    topic = db.query(models.SmallTalkTopic).filter(
                        models.SmallTalkTopic.topic_id == my_smalltalk.topic_id
                    ).first()
                    
                    if topic:
                        entry["smalltalk"] = {
                            "topic": topic.question_text,
                            "my_answer": my_smalltalk.answer_content,
                            "partner_answer": partner_ans_content
                        }
            except Exception:
                pass
                
            diary_result.append(entry)
        
        # 다이어리 외 전체 스몰토크 리스트
        smalltalk_result = []
        try:
            my_answers = db.query(models.SmallTalkAnswer).filter(
                models.SmallTalkAnswer.user_id == user_id
            ).order_by(models.SmallTalkAnswer.created_at.desc()).all()
            
            for my_ans in my_answers:
                # 🚀 [수정] 파트너 답변 여부에 관계없이 스몰토크 리스트에 추가
                partner_ans_content = "아직 답변하지 않았습니다."
                
                if partner_id:
                    partner_ans = db.query(models.SmallTalkAnswer).filter(
                        models.SmallTalkAnswer.user_id == partner_id,
                        models.SmallTalkAnswer.topic_id == my_ans.topic_id
                    ).first()
                    
                    if partner_ans:
                        partner_ans_content = partner_ans.answer_content
                        
                topic = db.query(models.SmallTalkTopic).filter(
                    models.SmallTalkTopic.topic_id == my_ans.topic_id
                ).first()
                
                if topic:
                    date_str = str(my_ans.created_at).split(" ")[0] if my_ans.created_at else "2026-05-26"
                    smalltalk_result.append({
                        "id": my_ans.answer_id,
                        "date": date_str,
                        "topic": topic.question_text,
                        "my_answer": my_ans.answer_content,
                        "partner_answer": partner_ans_content
                    })
        except Exception:
            pass
        
        return {
            "status": "Success",
            "diary_entries": diary_result,
            "smalltalk_entries": smalltalk_result
        }
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 💬 7. 커뮤니티 API (게시글 & 댓글)
# =====================================================================
@app.get("/api/community/posts")
def get_community_posts(db: Session = Depends(database.get_db)):
    try:
        results = db.query(
            models.CommunityPost,
            models.User.name,
            models.User.role,
            models.User.pregnancy_start_date,
            func.count(models.CommunityComment.comment_id).label("comment_count")
        ).outerjoin(
            models.User, models.CommunityPost.user_id == models.User.id
        ).outerjoin(
            models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id
        ).group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()
        
        posts = []
        for post, user_name, user_role, preg_date, count in results:
            posts.append({
                "post_id": post.post_id,
                "user_id": post.user_id,
                "pregnancy_period": post.pregnancy_period,
                "title": post.title,
                "content": post.content,
                "created_at": post.created_at,
                "author": user_name or "익명",
                "role": user_role,
                "comment_count": count
            })
        return {"status": "Success", "posts": posts}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.post("/api/community/posts")
def create_community_post(post: PostCreate, db: Session = Depends(database.get_db)):
    new_post = models.CommunityPost(
        user_id=post.user_id,
        pregnancy_period=post.pregnancy_period,
        title=post.title,
        content=post.content
    )
    db.add(new_post)
    db.commit()
    return {"status": "Success"}

@app.delete("/api/community/posts/{post_id}")
def delete_community_post(post_id: int, db: Session = Depends(database.get_db)):
    post = db.query(models.CommunityPost).filter(models.CommunityPost.post_id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    db.delete(post)
    db.commit()
    return {"status": "Success"}

@app.get("/api/posts/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(database.get_db)):
    try:
        comments = db.query(
            models.CommunityComment, models.User.name, models.User.role, models.User.pregnancy_start_date
        ).outerjoin(
            models.User, models.CommunityComment.user_id == models.User.id
        ).filter(models.CommunityComment.post_id == post_id).order_by(models.CommunityComment.created_at.asc()).all()

        result = []
        for c, user_name, user_role, start_date in comments:
            result.append({
                "id": c.comment_id,
                "user_id": c.user_id,
                "content": c.content,
                "created_at": c.created_at,
                "author_name": user_name or "익명",
                "author_role": user_role,
                "pregnancy_start_date": str(start_date) if start_date else None
            })
        return {"status": "Success", "comments": result}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.post("/api/posts/{post_id}/comments")
def create_post_comment(post_id: int, comment_data: CommentCreate, db: Session = Depends(database.get_db)):
    try:
        new_comment = models.CommunityComment(
            post_id=post_id,
            user_id=comment_data.user_id,
            content=comment_data.content
        )
        db.add(new_comment)
        db.commit()
        return {"status": "Success"}
    except Exception as e:
        db.rollback()
        return {"status": "Error", "message": str(e)}

@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, user_id: int, db: Session = Depends(database.get_db)):
    comment = db.query(models.CommunityComment).filter(models.CommunityComment.comment_id == comment_id).first()
    if not comment: raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != user_id: raise HTTPException(status_code=403, detail="권한이 없습니다.")
    db.delete(comment)
    db.commit()
    return {"status": "Success"}


# =====================================================================
# 📊 8. 마이페이지 (내 활동 내역) API
# =====================================================================
@app.get("/api/community/posts/count/{user_id}")
def get_community_posts_count(user_id: int, db: Session = Depends(database.get_db)):
    count = db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).count()
    return {"status": "Success", "count": count}

@app.get("/api/community/comments/count/{user_id}")
def get_community_comments_count(user_id: int, db: Session = Depends(database.get_db)):
    count = db.query(models.CommunityComment).filter(models.CommunityComment.user_id == user_id).count()
    return {"status": "Success", "count": count}

@app.get("/api/community/my-posts/{user_id}")
def get_my_posts(user_id: int, db: Session = Depends(database.get_db)):
    try:
        results = db.query(
            models.CommunityPost, models.User.name.label("author_name"), models.User.role.label("author_role"), func.count(models.CommunityComment.comment_id).label("comment_count")
        ).outerjoin(models.User, models.CommunityPost.user_id == models.User.id)\
         .outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id)\
         .filter(models.CommunityPost.user_id == user_id)\
         .group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()

        posts = []
        for post, author_name, author_role, count in results:
            posts.append({
                "post_id": post.post_id, "user_id": post.user_id, "pregnancy_period": post.pregnancy_period,
                "title": post.title, "content": post.content, "created_at": post.created_at,
                "author": author_name or "익명", "role": author_role, "comment_count": count
            })
        return {"status": "Success", "posts": posts}
    except Exception as e:
        return {"status": "Error", "message": str(e)}

@app.get("/api/community/my-comments/{user_id}")
def get_my_commented_posts(user_id: int, db: Session = Depends(database.get_db)):
    try:
        subquery = db.query(models.CommunityComment.post_id).filter(models.CommunityComment.user_id == user_id).distinct().subquery()
        results = db.query(
            models.CommunityPost, models.User.name.label("author_name"), models.User.role.label("author_role"), func.count(models.CommunityComment.comment_id).label("comment_count")
        ).outerjoin(models.User, models.CommunityPost.user_id == models.User.id)\
         .outerjoin(models.CommunityComment, models.CommunityPost.post_id == models.CommunityComment.post_id)\
         .filter(models.CommunityPost.post_id.in_(subquery))\
         .group_by(models.CommunityPost.post_id, models.User.id).order_by(models.CommunityPost.created_at.desc()).all()

        posts = []
        for post, author_name, author_role, count in results:
            posts.append({
                "post_id": post.post_id, "user_id": post.user_id, "pregnancy_period": post.pregnancy_period,
                "title": post.title, "content": post.content, "created_at": post.created_at,
                "author": author_name or "익명", "role": author_role, "comment_count": count
            })
        return {"status": "Success", "comments": posts} 
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 📅 9. 캘린더 (일정 관리) API
# =====================================================================
@app.get("/api/calendar/events/{connection_code}")
def get_calendar_events(connection_code: str, db: Session = Depends(database.get_db)):
    if not connection_code or connection_code == "None":
        return {"status": "Success", "events": []}
    events = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.connection_code == connection_code).all()
    result = [{"event_id": e.event_id, "event_type": e.event_type, "title": e.title, "content": e.content, "event_date": str(e.event_date)} for e in events]
    return {"status": "Success", "events": result}

@app.post("/api/calendar/events")
def create_calendar_event(event: EventCreate, db: Session = Depends(database.get_db)):
    new_event = models.SharedCalendarEvent(
        connection_code=event.connection_code, event_type=event.event_type,
        title=event.title, content=event.content, event_date=event.event_date
    )
    db.add(new_event)
    db.commit()
    return {"status": "Success"}

@app.delete("/api/calendar/events/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(database.get_db)):
    event = db.query(models.SharedCalendarEvent).filter(models.SharedCalendarEvent.event_id == event_id).first()
    if not event: raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    db.delete(event)
    db.commit()
    return {"status": "Success"}

@app.get("/api/calendar/checkups/{connection_code}")
def get_checkup_dates(connection_code: str, db: Session = Depends(database.get_db)):
    try:
        today = date.today()
        hospital_types = ["hospital", "ultrasound", "clinic"]
        events = db.query(models.SharedCalendarEvent).filter(
            models.SharedCalendarEvent.connection_code == connection_code,
            models.SharedCalendarEvent.event_type.in_(hospital_types)
        ).all()

        past_events = [e for e in events if e.event_date and e.event_date <= today]
        future_events = [e for e in events if e.event_date and e.event_date > today]

        recent_event = max(past_events, key=lambda x: x.event_date) if past_events else None
        next_event = min(future_events, key=lambda x: x.event_date) if future_events else None

        def format_date(d): return f"{d.year}년 {d.month}월 {d.day}일" if d else "등록된 일정 없음"

        return {
            "status": "Success",
            "recent_checkup": format_date(recent_event.event_date) if recent_event else "등록된 일정 없음",
            "next_checkup": format_date(next_event.event_date) if next_event else "등록된 일정 없음"
        }
    except Exception as e:
        return {"status": "Error", "message": str(e)}


# =====================================================================
# 💬 10. 스몰토크 API
# =====================================================================
@app.get("/api/smalltalk/{user_id}")
def get_smalltalk(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404)
    
    partner = db.query(models.User).filter(models.User.id == user.parent_user_id).first() if user.parent_user_id else db.query(models.User).filter(models.User.parent_user_id == user.id).first()
    today_topic = smalltalk_service.get_today_topic(db)
    
    my_answer_obj = db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.topic_id == today_topic.topic_id, models.SmallTalkAnswer.user_id == user.id).first()
    partner_answer_obj = db.query(models.SmallTalkAnswer).filter(models.SmallTalkAnswer.topic_id == today_topic.topic_id, models.SmallTalkAnswer.user_id == partner.id).first() if partner else None

    return {
        "status": "Success",
        "topic": {"topic_id": today_topic.topic_id, "question_text": today_topic.question_text},
        "my_answer": my_answer_obj.answer_content if my_answer_obj else None,
        "partner_name": partner.name if partner else "파트너",
        "is_partner_answered": bool(partner_answer_obj),
        "partner_answer": partner_answer_obj.answer_content if (my_answer_obj and partner_answer_obj) else None
    }
    
@app.post("/api/smalltalk/answer")
def submit_smalltalk_answer(ans: schemas.SmallTalkSubmit, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == ans.user_id).first()
    new_ans = models.SmallTalkAnswer(
        topic_id=ans.topic_id, user_id=ans.user_id,
        connection_code=user.connection_code if user.connection_code else "DEMO_CODE",
        answer_content=ans.answer_content
    )
    db.add(new_ans)
    db.commit()
    return {"status": "Success"}


# =====================================================================
# 🤖 11. AI 복합 가전 추천 API (🚀 감정 가중치 모델 + 날씨 복합 실시간 보정 연산)
# =====================================================================
@app.get("/api/ai/recommend-appliances/{user_id}")
def recommend_appliances(user_id: int, db: Session = Depends(database.get_db)):
    try:
        master_id = get_family_master_id(user_id, db)
        logs = db.query(models.DiaryLog).filter(models.DiaryLog.user_id == master_id).all()
        
        # 1. 역사적 감정 가중치(Score) 테이블
        emotion_weights = {
            "행복": 1.0, "안정": 1.0, "설렘": 1.0,     # 긍정 상태: 최적 수치를 해당 방향으로 인력 발생
            "중립": 0.0,                               # 중립 상태: 영향 없음
            "불안": -1.0, "피로": -1.0, "우울": -1.0, "화남": -1.0  # 부정 상태: 최적 수치를 반대 방향으로 척력 발생
        }
        
        # 기본 실내 권장 최적 기준점 (학습 기준 시작선)
        learned_temp = 24.0  
        learned_humidity = 50.0 
        learning_rate = 0.15  # 보정 민감도 (15%씩 반영)
        
        # 과거 일기 데이터를 통한 유저 성향 비동기 기계학습
        for log in logs:
            if log.temperature_ambient is not None and log.humidity_ambient is not None:
                weight = emotion_weights.get(log.selected_emotion, 0.0)
                
                temp_diff = float(log.temperature_ambient) - learned_temp
                hum_diff = float(log.humidity_ambient) - learned_humidity
                
                # 가중치 연산 수행
                learned_temp += temp_diff * weight * learning_rate
                learned_humidity += hum_diff * weight * learning_rate
                
        # 비정상 수치 튐 방지 예외 제어선
        learned_temp = max(21.0, min(27.0, learned_temp))
        learned_humidity = max(40.0, min(60.0, learned_humidity))

        # 2. 현재 실시간 외부 날씨 데이터 연동 (OpenWeatherMap)
        WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
        current_temp = 25.0
        current_humidity = 55.0
        current_weather_desc = "맑음"
        
        if WEATHER_API_KEY:
            try:
                res = requests.get(f"http://api.openweathermap.org/data/2.5/weather?q=Seoul&appid={WEATHER_API_KEY}&units=metric&lang=kr")
                if res.status_code == 200:
                    w_data = res.json()
                    current_temp = float(w_data['main']['temp'])
                    current_humidity = float(w_data['main']['humidity'])
                    current_weather_desc = w_data['weather'][0]['description']
            except Exception:
                pass

        # 3. 🚀 마이 로드의 핵심 기획: [과거 성향 + 현재 날씨 실시간 온습도] 복합 연산 최적값 도출
        # 신체 면역력과 실외 적응력을 고려한 '외기 적응형 복합 조율 공식' 적용
        # 최종 최적 온도 = 학습 선호도 + (실외 온도 - 학습 선호도) * 외기 순응 계수 (10%)
        final_optimal_temp = learned_temp + (current_temp - learned_temp) * 0.1
        final_optimal_temp = round(max(22.0, min(26.0, final_optimal_temp)), 1)
        
        # 최종 최적 습도 = 실외 습도 유입 및 공기 질량 밸런싱 공식 연산 (5%)
        final_optimal_humidity = learned_humidity + (current_humidity - learned_humidity) * 0.05
        final_optimal_humidity = round(max(45.0, min(60.0, final_optimal_humidity)), 1)
        
        # 4. 도출된 복합 최적 목표값을 바탕으로 가전 제어 가이드라인 패키지 생성
        recommendations = []
        
        # 에어컨 냉난방 제어 판별
        if current_temp > final_optimal_temp + 0.5:
            recommendations.append({
                "key": "aircon", "name": "에어컨", "action": f"{int(final_optimal_temp)}℃ 냉방", "icon": "❄️",
                "reason": f"현재 실외({int(current_temp)}℃)가 더운 상태입니다. 과거 일기 기록과 외기를 복합 고려한 최적 온도({final_optimal_temp}℃)로 낮출게요.",
                "settings": {"temp": int(final_optimal_temp), "mode": "냉방", "fan": 2}
            })
        elif current_temp < final_optimal_temp - 0.5:
            recommendations.append({
                "key": "aircon", "name": "에어컨", "action": f"{int(final_optimal_temp)}℃ 난방", "icon": "☀️",
                "reason": f"바깥 날씨({int(current_temp)}℃)가 쌀쌀합니다. 산모 신체 적응력을 고려해 설계한 최적 온도({final_optimal_temp}℃)로 온도를 올릴게요.",
                "settings": {"temp": int(final_optimal_temp), "mode": "난방", "fan": 1}
            })
            
        # 제습기 및 가습기 조율 판별
        if current_humidity > final_optimal_humidity + 4.0:
            recommendations.append({
                "key": "dehumidifier", "name": "제습기", "action": f"{int(final_optimal_humidity)}% 제습", "icon": "🌊",
                "reason": f"실외 습도({int(current_humidity)}%)가 높아 실내 유입이 우려됩니다. 도출된 최적 습도({final_optimal_humidity}%)로 보정할게요.",
                "settings": {"humidity": int(final_optimal_humidity), "intensity": 2}
            })
        elif current_humidity < final_optimal_humidity - 4.0:
            recommendations.append({
                "key": "humidifier", "name": "가습기", "action": f"{int(final_optimal_humidity)}% 가습", "icon": "💧",
                "reason": f"현재 공기({int(current_humidity)}%)가 많이 건조하여 기관지가 예민해질 수 있습니다. 쾌적 최적 습도({final_optimal_humidity}%)로 조절할게요.",
                "settings": {"humidity": int(final_optimal_humidity), "intensity": 2}
            })
            
        # 기상 조건에 따른 실내 공기청정기 제어
        if any(keyword in current_weather_desc for keyword in ["비", "흐림", "구름", "안개", "먼지"]):
            recommendations.append({
                "key": "airPurifier", "name": "공기청정기", "action": "자동 모드", "icon": "💨",
                "reason": f"현재 바깥 날씨가 '{current_weather_desc}' 상태로 환기가 제한되므로 실내 공기를 정화 가동합니다.",
                "settings": {"mode": "자동", "speed": 2}
            })
            
        return {
            "status": "Success",
            "optimal_temp": final_optimal_temp,
            "optimal_humidity": final_optimal_humidity,
            "current_temp": int(current_temp),
            "current_weather": current_weather_desc,
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"🚨 복합 가전 추천 시스템 가동 에러: {str(e)}")
        return {"status": "Error", "message": str(e)}
