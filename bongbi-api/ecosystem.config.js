module.exports = {
  apps: [
    {
      name: "bongbi-api",
      script: "/root/bongbi-SaaS-v2/bongbi-api/.venv/bin/python",
      args: ["-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
      cwd: "/root/bongbi-SaaS-v2/bongbi-api",
      env: {
        VITE_API_BASE_URL: "/api/v1/",
        PYTHONPATH: "."
      }
    }
  ]
}
