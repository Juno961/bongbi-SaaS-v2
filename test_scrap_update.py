#!/usr/bin/env python3
"""
스크랩 계산에서 제품 총중량 업데이트 테스트
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'bongbi-api'))

from core_logic.scrap import calculate_scrap_metrics

def test_scrap_total_weight_update():
    """실제 제품 중량 입력 시 제품 총중량 업데이트 테스트"""
    
    # 테스트 데이터 (스크린샷과 유사한 조건)
    test_data = {
        "totalWeight": 23.790,  # 기존 계산된 제품 총중량 (kg)
        "materialTotalWeight": 29.738,  # 봉재 총중량 (kg) 
        "totalCost": 252769,  # 총 재료비 (원)
        "quantity": 100,  # 수량
        "actualProductWeight": 225.5,  # 실제 제품 중량 (g)
        "recoveryRatio": 90,  # 환산율 (%)
        "scrapUnitPrice": 7589  # 스크랩 단가 (원/kg)
    }
    
    print("=== 스크랩 계산 제품 총중량 업데이트 테스트 ===")
    print(f"입력 조건:")
    print(f"  - 기존 제품 총중량: {test_data['totalWeight']} kg")
    print(f"  - 봉재 총중량: {test_data['materialTotalWeight']} kg")
    print(f"  - 수량: {test_data['quantity']} 개")
    print(f"  - 실제 제품 중량: {test_data['actualProductWeight']} g")
    print()
    
    # 스크랩 계산 실행
    result = calculate_scrap_metrics(test_data)
    
    print("계산 결과:")
    print(f"  - 업데이트된 제품 총중량: {result.get('updatedTotalWeight', 'None')} kg")
    print(f"  - 실제 제품 총중량: {result.get('totalActualProductWeight', 'None')} kg")
    print(f"  - 스크랩 중량: {result.get('scrapWeight', 0)} kg")
    print(f"  - 스크랩 절약액: {result.get('scrapSavings', 0)} 원")
    print(f"  - 실제 재료비: {result.get('realCost', 0)} 원")
    print()
    
    # 검증
    expected_actual_total = (test_data['actualProductWeight'] * test_data['quantity']) / 1000.0
    actual_total = result.get('totalActualProductWeight')
    
    print("검증:")
    print(f"  - 예상 실제 제품 총중량: {expected_actual_total} kg")
    print(f"  - 계산된 실제 제품 총중량: {actual_total} kg")
    print(f"  - 일치 여부: {'✅' if abs(expected_actual_total - (actual_total or 0)) < 0.001 else '❌'}")
    
    # 업데이트된 제품 총중량 확인
    updated_total = result.get('updatedTotalWeight')
    print(f"  - 업데이트된 제품 총중량: {updated_total} kg")
    print(f"  - 실제 제품 총중량과 일치: {'✅' if updated_total == actual_total else '❌'}")
    
    # 경고 메시지 확인
    warnings = result.get('warnings', [])
    if warnings:
        print(f"\n경고 메시지:")
        for warning in warnings:
            print(f"  - [{warning.type}] {warning.message}")
    
    return result

if __name__ == "__main__":
    test_scrap_total_weight_update()
