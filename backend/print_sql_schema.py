from sqlalchemy.schema import CreateTable

from app import models  # ⚠️ 모든 모델이 Base에 등록되도록 반드시 import
from app.database import Base, engine


def export_schema_to_file(filename="schema.sql"):
    """모든 SQLAlchemy 모델의 CREATE TABLE 문을 SQL 파일로 내보냄"""
    with open(filename, "w", encoding="utf-8") as f:
        for table_name, table_obj in Base.metadata.tables.items():
            f.write(f"-- Table: {table_name}\n")
            ddl = str(CreateTable(table_obj).compile(engine))
            f.write(ddl + ";\n")
            f.write("-" * 80 + "\n\n")

    print(f"✅ SQL 스키마가 '{filename}' 파일로 저장되었습니다.")


if __name__ == "__main__":
    export_schema_to_file()
