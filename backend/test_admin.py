# test_admin.py
from fastapi import FastAPI, Depends, HTTPException, Request # type: ignore

app = FastAPI()

# 관리자 권한 확인용 더미 함수
def get_current_user(request: Request):
    # 테스트용: Authorization 헤더가 있으면 관리자, 없으면 에러
    auth = request.headers.get("Authorization", "")
    if auth == "Bearer admin-token":
        return {"id": 1, "username": "admin", "role": "admin"}
    else:
        raise HTTPException(status_code=401, detail="관리자 권한 없음")

@app.get("/")
def root():
    return {"msg": "서버 정상 동작 중"}

@app.get("/admin")
def read_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="관리자 전용 접근 금지")
    return {"msg": f"관리자({user['username']}) 권한 확인 완료 ✅"}
