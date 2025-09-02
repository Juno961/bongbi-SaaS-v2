module.exports = {
  apps: [
    {
      name: "bongbi-api",
      // 가상환경 안의 python 실행기를 사용
      script: "/root/bongbi-SaaS-v2/bongbi-api/.venv/bin/python",
      // uvicorn을 python 모듈(-m)로 실행, main.py의 app 객체 지정
      args: "-m uvicorn app.main:app --host 0.0.0.0 --port 8000",
      cwd: "/root/bongbi-SaaS-v2/bongbi-api", // 프로젝트 루트
      env: {
        VITE_API_BASE_URL: "/api/v1/",
        PYTHONPATH: "."
      }
    }
  ]
}
