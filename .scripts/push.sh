#!/usr/bin/env bash
set -e
cd ~/bongbi-SaaS-v2

branch="$(git rev-parse --abbrev-ref HEAD)"
msg="auto: $(date +'%Y-%m-%d %H:%M:%S')"

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "$msg"
fi

git push origin "$branch"
echo "Pushed at $msg"
