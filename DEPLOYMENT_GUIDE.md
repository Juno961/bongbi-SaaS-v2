# Bongbi SaaS 배포 가이드

## 현재 상황 분석

### 문제
- Git pull만 실행 → 소스 코드만 업데이트됨
- React/TypeScript 코드는 빌드가 필요함
- nginx는 `/var/www/bongassist`의 **빌드된 파일**을 서빙
- 빌드하지 않으면 변경사항이 반영되지 않음

### Nginx 설정 확인
```nginx
location / {
    root /var/www/bongassist;  # ← 여기서 정적 파일 서빙
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

## 배포 방법

### 방법 1: 자동 배포 스크립트 사용 (권장)

```bash
# 스크립트에 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

### 방법 2: 수동 배포

```bash
# 1. 최신 코드 가져오기
git pull origin main

# 2. 프론트엔드 디렉토리로 이동
cd bongbi-web

# 3. 의존성 설치 (처음이거나 package.json 변경 시)
npm install

# 4. 프로덕션 빌드
npm run build

# 5. 빌드 결과물을 nginx 경로로 복사
sudo rm -rf /var/www/bongassist/*
sudo cp -r dist/* /var/www/bongassist/

# 6. 소유권 설정 (필요시)
sudo chown -R www-data:www-data /var/www/bongassist

# 7. nginx 재시작
sudo systemctl reload nginx

# 8. 브라우저 캐시 클리어 후 확인
# Ctrl + Shift + R (또는 Cmd + Shift + R)
```

## 빌드 확인

빌드가 성공하면 다음과 같은 출력이 나타납니다:

```
✓ built in 15.23s
✓ 234 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.30 kB
dist/assets/index-abc123.css     45.67 kB │ gzip: 12.34 kB
dist/assets/index-xyz789.js     234.56 kB │ gzip: 78.90 kB
```

## 문제 해결

### 1. npm 명령어를 찾을 수 없음
```bash
# Node.js 설치 확인
node --version
npm --version

# 설치되어 있지 않다면
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 권한 오류
```bash
# sudo 없이 실행했거나 권한 문제
sudo chown -R $USER:$USER /var/www/bongassist
```

### 3. 빌드 오류 발생
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 4. 브라우저에서 변경사항이 안 보임
```bash
# 강력한 새로고침 (브라우저 캐시 클리어)
# Chrome/Edge: Ctrl + Shift + R
# Firefox: Ctrl + F5
# Safari: Cmd + Shift + R

# 또는 개발자 도구에서 "Disable cache" 체크
```

## 배포 후 확인 사항

### 1. 빌드 파일 확인
```bash
ls -la /var/www/bongassist/
# index.html, assets/ 디렉토리가 있어야 함
```

### 2. Nginx 상태 확인
```bash
sudo systemctl status nginx
sudo nginx -t  # 설정 파일 문법 검사
```

### 3. 브라우저에서 확인
1. https://bongassist.com 접속
2. F12 → Console 열기
3. 새로고침 (Ctrl + Shift + R)
4. 콘솔에 다음 로그가 나타나는지 확인:
   - `🚀 [MaterialFormWizard] 초기화 - getAllMaterials() 호출`
   - `📦 [getAllMaterials] localStorage에서 로드된 데이터`
   - `🎯 [getAllMaterials] 최종 소재 목록`

### 4. 소재 추가 테스트
1. 설정 → 소재 탭
2. "+ 소재 추가" 클릭
3. 소재 정보 입력 후 추가
4. 콘솔에 로그 확인:
   - `💾 [Settings] 저장할 소재 목록`
   - `🔔 [MaterialFormWizard] materialDefaultsChanged 이벤트 받음`
5. 자재계산기로 이동하여 드롭다운 확인

## 향후 배포 자동화 (선택사항)

### GitHub Actions 자동 배포 설정
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/bongbi-SaaS-v2
            ./deploy.sh
```

## 백엔드 배포 (필요시)

백엔드(FastAPI)도 변경되었다면:

```bash
# 1. 백엔드 디렉토리로 이동
cd bongbi-api

# 2. 의존성 업데이트
pip install -r requirements.txt

# 3. PM2로 재시작 (또는 systemd)
pm2 restart bongbi-api
# 또는
sudo systemctl restart bongbi-api
```

## 배포 체크리스트

- [ ] Git pull 실행
- [ ] npm install (의존성 변경 시)
- [ ] npm run build 실행
- [ ] 빌드 파일 복사 (/var/www/bongassist)
- [ ] nginx 재시작
- [ ] 브라우저 강력 새로고침
- [ ] 콘솔 로그 확인
- [ ] 소재 추가 기능 테스트
- [ ] 자재계산기 드롭다운 확인

