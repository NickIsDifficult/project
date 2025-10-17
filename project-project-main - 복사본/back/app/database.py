from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ✅ mysql-connector-python 드라이버 사용
DATABASE_URL = "mysql+mysqlconnector://project:project@127.0.0.1:3306/project"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connection_timeout": 5, "use_pure": True},  # 5초만 대기
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# DB 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
