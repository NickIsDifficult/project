from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ✅ MySQL 연결 URL (mysql-connector-python 드라이버 사용)
DATABASE_URL = "mysql+mysqlconnector://root:990113@127.0.0.1:3306/projectdb?charset=utf8mb4"

# ✅ SQLAlchemy 엔진 생성
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # 연결 확인 자동 수행 (끊긴 세션 자동 복구)
    pool_recycle=3600,        # 1시간마다 커넥션 재활용 (MySQL timeout 방지)
    connect_args={"connection_timeout": 5, "use_pure": True},
)

# ✅ 세션 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ ORM 모델의 Base 클래스
Base = declarative_base()

# ✅ 의존성 주입용 DB 세션 함수 (FastAPI용)
def get_db():
    """요청마다 독립적인 DB 세션을 생성하고, 요청 종료 시 자동으로 닫습니다."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
