#!/bin/bash

# Bongbi SaaS 배포 스크립트
# 사용법: ./deploy.sh

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 Bongbi SaaS 배포 시작..."

# 1. 최신 코드 가져오기
echo "📥 Git pull..."
git pull origin main

# 2. 프론트엔드 빌드
echo "🔨 프론트엔드 빌드 중..."
cd bongbi-web
npm install  # 의존성 업데이트 (필요시)
npm run build

# 3. 빌드된 파일을 nginx 경로로 복사
echo "📦 빌드 파일 배포 중..."
sudo rm -rf /var/www/bongassist/*
sudo cp -r dist/* /var/www/bongassist/

# 4. nginx 재시작 (캐시 클리어)
echo "🔄 Nginx 재시작..."
sudo systemctl reload nginx

echo "✅ 배포 완료!"
echo "🌐 https://bongassist.com 에서 확인하세요"

