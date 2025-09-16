// bongbi-api/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "bongbi-api",
      cwd: "/root/bongbi-SaaS-v2/bongbi-api",
      script: "./.venv/bin/uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8000",
      interpreter: "none",           // Node 해석 금지, 그대로 실행
      env: {
        PYTHONPATH: "."
        // 비밀은 넣지 않음 (.env + python-dotenv로 로드)
      }
    }
  ]
}
