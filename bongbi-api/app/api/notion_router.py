from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import os
import logging
from typing import Optional

# 노션 클라이언트 임포트 (추후 설치)
try:
    from notion_client import Client
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False
    logging.warning("notion-client가 설치되지 않았습니다. pip install notion-client로 설치하세요.")

from app.api.schemas import (
    CustomerInquiryRequest, 
    CustomerInquiryResponse, 
    NotionErrorResponse
)

router = APIRouter(prefix="/notion", tags=["notion"])

# 환경변수에서 노션 설정 가져오기
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

# 노션 클라이언트 초기화
notion_client: Optional[Client] = None
if NOTION_AVAILABLE and NOTION_TOKEN:
    notion_client = Client(auth=NOTION_TOKEN)


@router.post("/customer-inquiry", response_model=CustomerInquiryResponse)
async def create_customer_inquiry(inquiry: CustomerInquiryRequest):
    """
    고객 문의를 노션 데이터베이스에 저장
    
    - **name**: 문의자 이름 (필수)
    - **email**: 문의자 이메일 (필수)
    - **subject**: 문의 제목 (필수)
    - **message**: 문의 내용 (필수)
    """
    current_time = datetime.now()
    
    # 노션 설정 검증
    if not NOTION_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="노션 연동 서비스를 사용할 수 없습니다. notion-client 패키지가 필요합니다."
        )
    
    if not NOTION_TOKEN or not NOTION_DATABASE_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="노션 설정이 완료되지 않았습니다. NOTION_TOKEN과 NOTION_DATABASE_ID를 설정하세요."
        )
    
    if not notion_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="노션 클라이언트 초기화에 실패했습니다."
        )
    
    try:
        # 노션 데이터베이스에 페이지 생성
        response = notion_client.pages.create(
            parent={"database_id": NOTION_DATABASE_ID},
            properties={
                "이름": {
                    "title": [
                        {
                            "text": {
                                "content": inquiry.name
                            }
                        }
                    ]
                },
                "이메일": {
                    "email": inquiry.email
                },
                "제목": {
                    "rich_text": [
                        {
                            "text": {
                                "content": inquiry.subject
                            }
                        }
                    ]
                },
                "메시지": {
                    "rich_text": [
                        {
                            "text": {
                                "content": inquiry.message
                            }
                        }
                    ]
                },
                "접수일시": {
                    "date": {
                        "start": current_time.isoformat()
                    }
                }
                # "처리상태": {
                #     "select": {
                #         "name": "신규"
                #     }
                # }
            }
        )
        
        return CustomerInquiryResponse(
            success=True,
            message="문의가 성공적으로 접수되었습니다.",
            inquiry_id=response["id"],
            timestamp=current_time
        )
        
    except Exception as e:
        logging.error(f"노션 API 오류: {str(e)}")
        
        # 노션 API 특정 오류 처리
        if "invalid_database_id" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="잘못된 데이터베이스 ID입니다. NOTION_DATABASE_ID를 확인하세요."
            )
        elif "unauthorized" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="노션 API 인증에 실패했습니다. NOTION_TOKEN을 확인하세요."
            )
        elif "validation" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"노션 데이터베이스 구조와 맞지 않습니다: {str(e)}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"노션 연동 중 오류가 발생했습니다: {str(e)}"
            )


@router.get("/health")
async def notion_health_check():
    """노션 연동 상태 확인"""
    status_info = {
        "notion_client_available": NOTION_AVAILABLE,
        "notion_token_set": bool(NOTION_TOKEN),
        "notion_database_id_set": bool(NOTION_DATABASE_ID),
        "client_initialized": notion_client is not None,
        "timestamp": datetime.now().isoformat()
    }
    
    if all([NOTION_AVAILABLE, NOTION_TOKEN, NOTION_DATABASE_ID, notion_client]):
        try:
            # 노션 데이터베이스 연결 테스트
            database_info = notion_client.databases.retrieve(database_id=NOTION_DATABASE_ID)
            status_info["database_connection"] = "success"
            status_info["database_title"] = database_info.get("title", [{}])[0].get("plain_text", "Unknown")
            status_info["status"] = "healthy"
        except Exception as e:
            status_info["database_connection"] = "failed"
            status_info["connection_error"] = str(e)
            status_info["status"] = "unhealthy"
    else:
        status_info["status"] = "not_configured"
    
    return status_info
