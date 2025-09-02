module.exports = {
  apps: [
    {
      name: "bongbi-api",
      script: "uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      interpreter: "/root/bongbi-SaaS-v2/bongbi-api/.venv/bin/python",
      cwd: "/root/bongbi-SaaS-v2/bongbi-api",
      env: {
        VITE_API_BASE_URL: "/api/v1/",
        PYTHONPATH: "."
      }
    }
  ]
}
