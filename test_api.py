#!/usr/bin/env python3
"""
봉비서 API 테스트 스크립트 - 버그 수정 검증
"""

import requests
import json

API_BASE_URL = "http://localhost:8000/api/v1"

def test_rod_calculation_with_bugs():
    """
    이전에 문제가 되었던 케이스들을 테스트
    1. 활용률 100% 초과 문제
    2. 스크랩 계산 검증 부재
    """
    
    print("=" * 60)
    print("🔧 봉비서 버그 수정 테스트")
    print("=" * 60)
    
    # 테스트 케이스 1: 활용률 100% 초과 케이스
    print("\n📋 테스트 1: 활용률 100% 초과 방지")
    test_data_1 = {
        "materialType": "rod",
        "shape": "circle",
        "diameter": 20,
        "productLength": 100,
        "quantity": 100,
        "cuttingLoss": 2,
        "headCut": 20,
        "tailCut": 50,
        "standardBarLength": 4000,
        "materialDensity": 7850,
        "materialPrice": 5000,
        "actualProductWeight": 500,  # 실제 중량 500g
        "recoveryRatio": 80,
        "scrapUnitPrice": 3000
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/calculate/rod", json=test_data_1)
        print(f"   상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            utilization_rate = data.get('utilizationRate', 0)
            print(f"   ✅ 활용률: {utilization_rate:.1f}%")
            
            if utilization_rate <= 100:
                print("   ✅ 활용률 100% 이하로 제한됨 - 버그 수정 성공!")
            else:
                print("   ❌ 활용률이 여전히 100% 초과")
                
            # 경고 메시지 확인
            warnings = data.get('warnings', [])
            suggestions = data.get('suggestions', [])
            print(f"   경고 개수: {len(warnings)}")
            print(f"   제안 개수: {len(suggestions)}")
            
            for i, warning in enumerate(warnings):
                print(f"     경고 {i+1}: {warning.get('message', warning)}")
            
            for i, suggestion in enumerate(suggestions):
                print(f"     제안 {i+1}: {suggestion}")
                
        else:
            print(f"   ❌ 요청 실패: {response.text}")
            
    except Exception as e:
        print(f"   ❌ 연결 오류: {e}")
    
    # 테스트 케이스 2: 스크랩 검증 (실제 중량 > 계산된 중량)
    print("\n📋 테스트 2: 스크랩 계산 검증")
    test_data_2 = {
        "materialType": "rod", 
        "shape": "circle",
        "diameter": 15,
        "productLength": 50,
        "quantity": 10,
        "cuttingLoss": 2,
        "headCut": 20,
        "tailCut": 250,
        "standardBarLength": 4000,
        "materialDensity": 7850,
        "materialPrice": 5000,
        "actualProductWeight": 500,  # 실제 중량을 계산된 것보다 크게 설정
        "recoveryRatio": 80,
        "scrapUnitPrice": 3000
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/calculate/rod", json=test_data_2)
        print(f"   상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # 총 중량과 실제 제품 중량 비교
            total_weight = data.get('totalWeight', 0)  # kg
            total_actual_weight = data.get('totalActualProductWeight', 0)  # kg
            
            print(f"   계산된 총 중량: {total_weight:.3f} kg")
            print(f"   실제 제품 총 중량: {total_actual_weight:.3f} kg")
            
            warnings = data.get('warnings', [])
            has_weight_warning = any('실제 제품 중량' in str(w) for w in warnings)
            
            if has_weight_warning:
                print("   ✅ 중량 불일치 경고 메시지 확인됨 - 버그 수정 성공!")
            else:
                print("   ❌ 중량 불일치 경고가 표시되지 않음")
                
            # 모든 경고 출력
            for i, warning in enumerate(warnings):
                print(f"     경고 {i+1}: {warning.get('message', warning)}")
                
        else:
            print(f"   ❌ 요청 실패: {response.text}")
            
    except Exception as e:
        print(f"   ❌ 연결 오류: {e}")

    print("\n" + "=" * 60)
    print("테스트 완료")
    print("=" * 60)

def test_api_health():
    """API 서버 상태 확인"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API 서버 정상 동작")
            print(f"   버전: {data.get('version', 'unknown')}")
            print(f"   컬럼마스터 준수: {data.get('column_master_compliant', False)}")
            return True
        else:
            print(f"❌ API 서버 오류: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API 서버 연결 실패: {e}")
        print("   백엔드 서버가 실행 중인지 확인하세요:")
        print("   cd C:\\AutomationHub\\Bongbi-SaaS\\Bong-bi\\bongbi-api")
        print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return False

if __name__ == "__main__":
    # API 서버 상태 먼저 확인
    if test_api_health():
        # 서버가 정상이면 버그 수정 테스트 실행
        test_rod_calculation_with_bugs()
    else:
        print("\n백엔드 서버를 먼저 시작해주세요.")
