"""
간단한 스크랩 계산 로직 테스트
"""

def parse_float_safe(value):
    """안전한 float 변환"""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def test_scrap_calculation():
    """스크랩 계산에서 제품 총중량 업데이트 로직 테스트"""
    
    # 테스트 데이터
    data = {
        "totalWeight": 23.790,  # 기존 계산된 제품 총중량 (kg)
        "materialTotalWeight": 29.738,  # 봉재 총중량 (kg) 
        "totalCost": 252769,  # 총 재료비 (원)
        "quantity": 100,  # 수량
        "actualProductWeight": 225.5,  # 실제 제품 중량 (g)
        "recoveryRatio": 90,  # 환산율 (%)
        "scrapUnitPrice": 7589  # 스크랩 단가 (원/kg)
    }
    
    # 기본 값 파싱
    total_weight = parse_float_safe(data.get("totalWeight"))
    quantity = parse_float_safe(data.get("quantity"))
    actual_product_weight_g = parse_float_safe(data.get("actualProductWeight"))
    material_total_weight = parse_float_safe(data.get("materialTotalWeight"))
    recovery_ratio = parse_float_safe(data.get("recoveryRatio"))
    scrap_unit_price = parse_float_safe(data.get("scrapUnitPrice"))
    
    print("=== 스크랩 계산 제품 총중량 업데이트 테스트 ===")
    print(f"입력 조건:")
    print(f"  - 기존 제품 총중량: {total_weight} kg")
    print(f"  - 봉재 총중량: {material_total_weight} kg")
    print(f"  - 수량: {quantity} 개")
    print(f"  - 실제 제품 중량: {actual_product_weight_g} g")
    print()
    
    # actualProductWeight 입력 시 totalWeight 재계산
    updated_total_weight = total_weight
    total_actual_product_weight_kg = None
    
    if actual_product_weight_g is not None and actual_product_weight_g > 0 and quantity is not None and quantity > 0:
        # 실제 제품 중량 기준으로 제품 총중량 업데이트
        total_actual_product_weight_kg = (actual_product_weight_g * quantity) / 1000.0
        updated_total_weight = total_actual_product_weight_kg
        print(f"✅ 실제 제품 중량 입력됨 - 제품 총중량 업데이트")
    elif actual_product_weight_g is None or actual_product_weight_g <= 0:
        # 기존 totalWeight의 80%를 실제 제품 중량으로 가정
        total_actual_product_weight_kg = total_weight * 0.8 if total_weight else 0.0
        print(f"⚠️ 실제 제품 중량 미입력 - 기존 중량의 80% 사용")
    
    # 스크랩 중량 계산 (봉재 총중량 - 실제 제품 총중량)
    scrap_weight = max(0.0, material_total_weight - total_actual_product_weight_kg) if total_actual_product_weight_kg else 0.0
    
    # 스크랩 절약 금액 계산
    if recovery_ratio > 100:
        recovery_ratio = 100.0
    
    scrap_savings = scrap_weight * scrap_unit_price * (recovery_ratio / 100.0)
    
    print("계산 결과:")
    print(f"  - 기존 제품 총중량: {total_weight} kg")
    print(f"  - 업데이트된 제품 총중량: {updated_total_weight} kg")
    print(f"  - 실제 제품 총중량: {total_actual_product_weight_kg} kg")
    print(f"  - 스크랩 중량: {scrap_weight:.3f} kg")
    print(f"  - 스크랩 절약액: {scrap_savings:.0f} 원")
    print()
    
    # 검증
    expected_actual_total = (actual_product_weight_g * quantity) / 1000.0
    
    print("검증:")
    print(f"  - 예상 실제 제품 총중량: {expected_actual_total} kg")
    print(f"  - 계산된 실제 제품 총중량: {total_actual_product_weight_kg} kg")
    print(f"  - 일치 여부: {'✅' if abs(expected_actual_total - (total_actual_product_weight_kg or 0)) < 0.001 else '❌'}")
    print(f"  - 업데이트된 제품 총중량: {updated_total_weight} kg")
    print(f"  - 실제 제품 총중량과 일치: {'✅' if updated_total_weight == total_actual_product_weight_kg else '❌'}")
    
    # 프론트엔드에서 표시될 값들
    print()
    print("프론트엔드 표시 예상값:")
    print(f"  - '제품 총중량' 영역: {updated_total_weight} kg (실제 제품 중량 기준)")
    print(f"  - '제품 중량' 영역: {actual_product_weight_g} g (사용자 입력값)")
    
    return {
        "updatedTotalWeight": updated_total_weight,
        "totalActualProductWeight": total_actual_product_weight_kg,
        "scrapWeight": scrap_weight,
        "scrapSavings": scrap_savings
    }

if __name__ == "__main__":
    test_scrap_calculation()
