# db.py
import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        conn = mysql.connector.connect(
            host="127.0.0.1",      # 또는 localhost
            port=3306,          # DB 서버 주소
            user="project",               # DB 계정
            password="project",        # DB 비밀번호
            database="project",  # 사용할 DB
            charset="utf8mb4"
        )
        return conn
    except Error as e:
        print("❌ DB 연결 실패:", e)
        return None
