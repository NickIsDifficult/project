# projectlist/database.py
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ✅ 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ MySQL 접속 정보
DB_USER = "project"
DB_PASSWORD = "project"
DB_HOST = "127.0.0.1"      # 또는 localhost
DB_PORT = "3306"
DB_NAME = "project"

# ✅ PyMySQL 드라이버 사용
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ✅ SQLAlchemy 엔진 생성
try:
    logger.info("🚀 DB 연결 시도 중...")
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,          # 연결 유효성 검사
        pool_recycle=3600,           # MySQL 연결 유지 시간
        echo=False                   # True면 SQL 쿼리 로그 출력
    )
    logger.info("✅ DB 엔진 생성 완료!")
except Exception as e:
    logger.error(f"❌ DB 엔진 생성 실패: {e}")
    raise

# ✅ 세션 및 베이스 선언
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ✅ 세션을 얻는 종속 함수 (FastAPI 의존성용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
