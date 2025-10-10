# 소재 추가 문제 디버깅 가이드

## 문제 설명
설정 메뉴에서 소재를 추가해도 자재계산기의 '재료 선택' 드롭다운에 나타나지 않는 문제

## 수정 사항

### 1. Settings.tsx
- **문제**: localStorage에 모든 소재를 저장하고 로드할 때 기본 소재를 덮어씀
- **해결**: 기본 소재 + localStorage 커스텀 소재를 병합하도록 수정

### 2. materialDefaults.ts
- **추가**: `getAllMaterials()` - 기본 소재 + 커스텀 소재 통합 반환
- **추가**: 디버깅 로그 추가

### 3. MaterialFormWizard.tsx & MaterialForm.tsx
- **수정**: 동적 소재 목록(`availableMaterials`) 사용
- **수정**: 이벤트 리스너로 실시간 업데이트
- **추가**: 디버깅 로그 추가

## 테스트 방법

### 1. 개발 서버 실행
```powershell
cd bongbi-web
npm run dev
```

### 2. 브라우저에서 테스트
1. 개발자 도구(F12) 열기 → Console 탭으로 이동
2. 설정 메뉴 → 소재 탭으로 이동
3. "+ 소재 추가" 버튼 클릭
4. 새 소재 정보 입력 (예: 소재명: "테스트소재", 봉단가: 5000)
5. "추가" 버튼 클릭

### 3. 콘솔 로그 확인
다음과 같은 로그가 출력되어야 합니다:

```
💾 [Settings] 저장할 소재 목록: Array(7) ["brass", "steel", "stainless_303", "stainless", "stainless_316", "aluminum", "new_1234567890"]
💾 [Settings] 저장할 전체 데이터: {brass: {...}, steel: {...}, ..., new_1234567890: {...}}
🔔 [MaterialFormWizard] materialDefaultsChanged 이벤트 받음: {brass: {...}, steel: {...}, ..., new_1234567890: {...}}
📦 [getAllMaterials] localStorage에서 로드된 데이터: {brass: {...}, steel: {...}, ..., new_1234567890: {...}}
🎯 [getAllMaterials] 최종 소재 목록: Array(7) ["brass", "steel", "stainless_303", "stainless", "stainless_316", "aluminum", "new_1234567890"]
🔄 [MaterialFormWizard] 업데이트된 소재 목록: Array(7) ["brass", "steel", "stainless_303", "stainless", "stainless_316", "aluminum", "new_1234567890"]
```

### 4. 자재계산기에서 확인
1. 자재계산기 페이지로 이동
2. "재료 선택" 드롭다운 클릭
3. 새로 추가한 소재가 목록에 나타나는지 확인

## 예상 결과
- ✅ 새 소재가 설정에 추가됨
- ✅ 자재계산기 드롭다운에 새 소재가 즉시 나타남
- ✅ 새 소재 선택 시 정상 작동

## 문제가 지속되는 경우

### localStorage 초기화
브라우저 콘솔에서 다음 명령어 실행:
```javascript
localStorage.removeItem('customMaterialDefaults');
location.reload();
```

### 콘솔 로그가 나타나지 않는 경우
1. 이벤트가 발송되는지 확인:
```javascript
window.addEventListener('materialDefaultsChanged', (e) => {
  console.log('✅ 이벤트 받음:', e.detail);
});
```

2. localStorage 확인:
```javascript
console.log(JSON.parse(localStorage.getItem('customMaterialDefaults')));
```

## 알려진 제한사항
- 브라우저를 새로고침하면 자재계산기는 정상 작동 (초기 로드 시 getAllMaterials() 호출)
- 실시간 반영은 이벤트 리스너에 의존

