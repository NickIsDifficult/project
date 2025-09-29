from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
import mysql.connector
import jwt
import datetime
import os
import smtplib
from email.mime.text import MIMEText
from typing import Dict, Any

# ========================
# FastAPI 초기화
# ========================
app = FastAPI()

# ========================
# CORS 설정
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # React 프론트 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "supersecretkey"

# ========================
# DB 연결
# ========================
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="990113",   # ⚠️ root 비밀번호 수정 필요
        database="collab_tool"
    )

# ========================
# JWT 인증
# ========================
def get_current_user(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization", "")
    print("🔎 Authorization 헤더:", auth_header)

    if not auth_header or not auth_header.startswith("Bearer "):
        print("⚠️ Authorization 헤더 없음")
        raise HTTPException(status_code=401, detail="토큰 없음")

    token = auth_header.replace("Bearer ", "")
    try:
        user = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print("✅ 토큰 디코딩 성공:", user)
        return user
    except jwt.ExpiredSignatureError:
        print("❌ 토큰 만료")
        raise HTTPException(status_code=401, detail="토큰 만료")
    except Exception as e:
        print("❌ 토큰 오류:", str(e))
        raise HTTPException(status_code=401, detail=f"토큰 오류: {str(e)}")

# ========================
# 로그인
# ========================
@app.post("/login")
async def login(data: dict):
    username, password = data.get("username"), data.get("password")
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE username=%s AND password=%s", (username, password))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        token = jwt.encode({
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "team_id": user.get("team_id"),
            "project_id": user.get("project_id"),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)   # ✅ 7일짜리 토큰
        }, SECRET_KEY, algorithm="HS256")
        return {"success": True, "token": token}
    return {"success": False, "message": "아이디/비밀번호 오류"}

# ========================
# 관리 로그 저장
# ========================
def save_log(user_id, action, target):
    conn = get_db(); cur = conn.cursor()
    cur.execute("INSERT INTO logs(user_id, action, target) VALUES(%s,%s,%s)", (user_id, action, target))
    conn.commit()
    cur.close(); conn.close()

# ========================
# 관리자 전용
# ========================
@app.get("/admin")
async def admin_only(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한 없음")
    return {"msg": "관리자(admin) 권한 확인 완료 ✅"}

# ========================
# 공지사항 (조회/등록/삭제)
# ========================
@app.get("/notices")
async def get_notices(user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT n.*, u.username,
               (SELECT COUNT(*) FROM amendments a WHERE a.notice_id = n.id) AS amendment_count
        FROM notices n
        JOIN users u ON u.id = n.author_id
        WHERE n.is_deleted = 0
        ORDER BY n.created_at DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@app.post("/notices")
async def create_notice(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""
        INSERT INTO notices(scope, team_id, project_id, title, body, author_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (data["scope"], data.get("team_id"), data.get("project_id"),
          data["title"], data["body"], user["id"]))
    conn.commit()
    save_log(user["id"], "공지 등록", data["title"])
    cur.close(); conn.close()
    return {"ok": True}

@app.delete("/notices/{notice_id}")
async def delete_notice(notice_id: int, user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor()
    cur.execute("UPDATE notices SET is_deleted=1 WHERE id=%s", (notice_id,))
    conn.commit()
    save_log(user["id"], "공지 삭제", str(notice_id))
    cur.close(); conn.close()
    return {"ok": True}

# ========================
# 공지사항 정정 (추가정정)
# ========================
@app.post("/notices/{notice_id}/amendments")
async def add_amendment(notice_id: int, data: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""
        INSERT INTO amendments(notice_id, author_id, body)
        VALUES (%s, %s, %s)
    """, (notice_id, user["id"], data["body"]))
    conn.commit()
    save_log(user["id"], "공지 정정 추가", f"Notice {notice_id}")
    cur.close(); conn.close()
    return {"ok": True}

@app.get("/notices/{notice_id}/amendments")
async def get_amendments(notice_id: int, user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT a.*, u.username
        FROM amendments a
        JOIN users u ON u.id = a.author_id
        WHERE a.notice_id = %s
        ORDER BY a.created_at ASC
    """, (notice_id,))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

# ========================
# 공지사항 참조 기능
# ========================
@app.post("/notices/{notice_id}/references")
async def add_reference(notice_id: int, data: Dict[str, Any], user: dict = Depends(get_current_user)):
    ref_id = data.get("ref_notice_id")
    if not ref_id:
        raise HTTPException(status_code=400, detail="ref_notice_id 필요")

    conn = get_db(); cur = conn.cursor()
    cur.execute(
        "INSERT INTO notice_references(notice_id, ref_notice_id, created_by) VALUES(%s,%s,%s)",
        (notice_id, ref_id, user["id"])
    )
    conn.commit()
    cur.close(); conn.close()
    save_log(user["id"], "공지 참조 추가", f"{notice_id} → {ref_id}")
    return {"ok": True}

@app.get("/notices/{notice_id}/references")
async def get_references(notice_id: int, user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT r.id, r.ref_notice_id, n.title AS ref_title
        FROM notice_references r
        JOIN notices n ON n.id = r.ref_notice_id
        WHERE r.notice_id=%s
    """, (notice_id,))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

# ========================
# 이벤트 (캘린더 일정)
# ========================
@app.get("/events")
async def get_events(project_id: int, user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM events WHERE project_id=%s", (project_id,))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@app.post("/events")
async def create_event(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""INSERT INTO events(project_id,title,description,start_date,end_date,created_by)
                   VALUES(%s,%s,%s,%s,%s,%s)""",
                (data["project_id"], data["title"], data.get("description"),
                 data["start_date"], data["end_date"], user["id"]))
    conn.commit()
    save_log(user["id"], "일정 등록", data["title"])
    cur.close(); conn.close()
    return {"ok": True}

# ========================
# 휴가/근태
# ========================
@app.get("/vacations")
async def get_vacations(user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""SELECT v.id, v.title, v.type, v.start_date, v.end_date, v.status, u.username
                   FROM vacations v
                   JOIN users u ON u.id = v.user_id
                   ORDER BY v.start_date ASC""")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@app.post("/vacations")
async def create_vacation(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""INSERT INTO vacations(user_id,title,type,start_date,end_date,status)
                   VALUES(%s,%s,%s,%s,%s,'대기')""",
                (user["id"], data["title"], data["type"], data["start_date"], data["end_date"]))
    conn.commit()
    save_log(user["id"], "휴가 등록", data["title"])
    cur.close(); conn.close()
    return {"ok": True}

# ========================
# 개인 상태창
# ========================
@app.get("/status")
async def get_status(user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor(dictionary=True)
    cur.execute("""SELECT s.id, s.type, s.start_date, s.end_date, u.username
                   FROM status s
                   JOIN users u ON s.user_id = u.id
                   ORDER BY s.start_date DESC""")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@app.post("/status")
async def create_status(data: Dict[str, Any], user: dict = Depends(get_current_user)):
    conn = get_db(); cur = conn.cursor()
    cur.execute("""INSERT INTO status(user_id,type,start_date,end_date)
                   VALUES(%s,%s,%s,%s)""",
                (user["id"], data["type"], data["start_date"], data["end_date"]))
    conn.commit()
    save_log(user["id"], "상태 등록", data["type"])
    cur.close(); conn.close()
    return {"ok": True}

# ========================
# 첨부파일 업로드
# ========================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "docx"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식")

    save_path = os.path.join(UPLOAD_FOLDER, filename)
    with open(save_path, "wb") as f:
        f.write(await file.read())

    return {"ok": True, "filename": filename, "path": f"/uploads/{filename}"}

# ========================
# 알림 기능 (메일)
# ========================
def send_email(to, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = "noreply@collabtool.com"
    msg['To'] = to
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("your_email@gmail.com", "app_password")  # ⚠️ Gmail 앱 비밀번호 필요
        server.sendmail(msg["From"], [to], msg.as_string())

@app.post("/test-email")
async def test_email(data: Dict[str, str], user: dict = Depends(get_current_user)):
    try:
        send_email(
            data.get("to", "본인메일@gmail.com"),
            data.get("subject", "테스트 메일"),
            data.get("body", "알림 기능 정상 동작 🚀"),
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
