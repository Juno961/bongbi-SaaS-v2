# --- main.py 상단 교체본 ---

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# 1) .env를 먼저 로드
load_dotenv()

# 2) 라우터는 그 다음에 import
from app.api.calculate_router import router as calculate_router
from app.api.notion_router import router as notion_router

app = FastAPI(title="봉비서 API", version="2.1.0",
              description="소규모 제조업을 위한 자재산출 및 작업관리 SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(calculate_router, prefix="/api/v1")
app.include_router(notion_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "봉비서 API가 정상적으로 동작하고 있습니다!",
            "version": "2.1.0", "docs": "/docs"}

# 디버그 엔드포인트 유지 중
@app.get("/debug/env")
async def debug_env():
    return {
        k: ("OK", len(os.getenv(k, ""))) if os.getenv(k) else "MISSING"
        for k in ("NOTION_TOKEN", "NOTION_DATABASE_ID", "ENVIRONMENT", "DEBUG")
    }
