from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# .env를 가장 먼저 로드
load_dotenv()

# 라우터는 이후에 import
from app.api.calculate_router import router as calculate_router
from app.api.notion_router import router as notion_router

app = FastAPI(
    title="봉비서 API",
    version="2.1.0",
    description="소공장을 위한 자재산출 및 작업관리 SaaS"
)

# CORS 설정
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

# 라우터 등록
app.include_router(calculate_router, prefix="/api/v1")
app.include_router(notion_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "봉비서 API가 정상적으로 동작하고 있습니다!",
        "version": "2.1.0",
        "docs": "/docs"
    }
