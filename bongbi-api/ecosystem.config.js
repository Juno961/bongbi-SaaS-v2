module.exports = {
  apps: [
    {
      name: "bongbi-api",
      script: "uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",   // uvicorn을 직접 실행하도록 설정
      cwd: "/root/bongbi-SaaS-v2/bongbi-api", // 서버 내 실제 경로로 수정
      env: {
        // 환경변수는 여기서 정의
        VITE_API_BASE_URL: "/api/v1/",
        PYTHONPATH: "."
      }
    }
  ]
}
