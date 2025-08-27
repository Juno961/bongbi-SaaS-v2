@echo off
echo 봉비서 백엔드 서버 시작 중...
echo.

cd /d "C:\AutomationHub\Bongbi-SaaS\Bong-bi\bongbi-api"

echo 현재 디렉토리: %CD%
echo.

REM 가상환경 활성화 시도
if exist "venv\Scripts\activate.bat" (
    echo 가상환경 활성화 중...
    call venv\Scripts\activate.bat
) else (
    echo 가상환경을 찾을 수 없습니다. 전역 Python을 사용합니다.
)

echo.
echo 서버 시작 중... (Ctrl+C로 중지)
echo 서버 주소: http://localhost:8000
echo API 문서: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
