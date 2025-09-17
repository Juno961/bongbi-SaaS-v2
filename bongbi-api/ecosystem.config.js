module.exports = {
  apps: [
    {
      name: "bongbi-api",
      cwd: "/root/bongbi-SaaS-v2/bongbi-api",
      script: "./.venv/bin/uvicorn",
      args: ["app.main:app", "--host", "127.0.0.1", "--port", "8000"],
      interpreter: "none",
      env: { PYTHONPATH: "." }
    }
  ]
}
