# 🚀 빠른 배포 가이드

## 서버에서 실행할 명령어

```bash
# 프로젝트 디렉토리로 이동
cd ~/bongbi-SaaS-v2  # 또는 실제 프로젝트 경로

# 최신 코드 받기
git pull

# 프론트엔드 빌드 및 배포
cd bongbi-web
npm install
npm run build
sudo cp -r dist/* /var/www/bongassist/
sudo systemctl reload nginx

# 완료!
```

## ⚡ 한 줄 명령어 (세미콜론 사용)

```bash
cd ~/bongbi-SaaS-v2 && git pull && cd bongbi-web && npm install && npm run build && sudo cp -r dist/* /var/www/bongassist/ && sudo systemctl reload nginx
```

## 📝 Windows PowerShell에서 서버 접속 후 실행

```powershell
# SSH로 서버 접속
ssh user@your-server-ip

# 위의 명령어 실행
cd ~/bongbi-SaaS-v2 && git pull && cd bongbi-web && npm install && npm run build && sudo cp -r dist/* /var/www/bongassist/ && sudo systemctl reload nginx
```

## ✅ 확인 방법

1. **브라우저에서 확인**
   - https://bongassist.com 접속
   - `Ctrl + Shift + R` (강력 새로고침)
   - F12 → Console 탭 확인

2. **예상되는 콘솔 로그**
   ```
   🚀 [MaterialFormWizard] 초기화 - getAllMaterials() 호출
   📦 [getAllMaterials] localStorage에서 로드된 데이터: {...}
   🎯 [getAllMaterials] 최종 소재 목록: (6) ['brass', 'steel', ...]
   ```

3. **소재 추가 테스트**
   - 설정 → 소재 탭 → "+ 소재 추가"
   - 소재명: "테스트", 봉단가: 5000
   - "추가" 버튼 클릭
   - 자재계산기로 이동
   - "재료 선택" 드롭다운에 "테스트" 나타나는지 확인

## 🔧 문제 해결

### 로그가 안 나타나는 경우
```javascript
// 브라우저 콘솔에서 실행
console.log("현재 빌드 시간:", document.lastModified);
localStorage.getItem('customMaterialDefaults');
```

### 빌드 시간 확인
```bash
# 서버에서 실행
ls -lh /var/www/bongassist/index.html
# 파일 수정 시간이 최근이어야 함
```

### 캐시 문제
- `Ctrl + Shift + R` 여러 번 시도
- 시크릿 모드에서 테스트
- 다른 브라우저에서 테스트

## 📌 중요!

**git pull만으로는 변경사항이 반영되지 않습니다!**
- React/TypeScript 코드는 **빌드**가 필요
- `npm run build` 필수
- 빌드 결과물을 `/var/www/bongassist/`로 복사 필수

