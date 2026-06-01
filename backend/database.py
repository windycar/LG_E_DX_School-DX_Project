import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

DB_USERNAME = os.getenv("DB_USERNAME", "campus_25KDT_LG_3")
DB_PASSWORD = os.getenv("DB_PASSWORD", "smhrd3")
DB_HOST = os.getenv("DB_HOST", "project-db-campus.smhrd.com")
DB_PORT = os.getenv("DB_PORT", "3307")
DB_NAME = os.getenv("DB_NAME", "campus_25KDT_LG_3")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 엔진 생성 (연결 풀링 설정)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DB 세션 의존성 함수 (API 호출 시 사용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
