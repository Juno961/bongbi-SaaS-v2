from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os, logging

from app.api.calculate_router import router as calculate_router
from app.api.notion_router import router as notion_router

# 환경변수 로드
load_dotenv()

# 환경변수 상태 로깅
for k in ("NOTION_TOKEN", "NOTION_DATABASE_ID", "ENVIRONMENT", "DEBUG"):
    v = os.getenv(k, "")
    logging.info(f"[ENV] {k} len={len(v)} status={'OK' if v else 'MISSING'}")

app = FastAPI(
    title="봉비서 API",
    version="2.1.0",
    description="소규모 제조업을 위한 자재산출 및 작업관리 SaaS"
)

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calculate_router, prefix="/api/v1")
app.include_router(notion_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "봉비서 API가 정상적으로 동작하고 있습니다!",
        "version": "2.1.0",
        "docs": "/docs"
    }
