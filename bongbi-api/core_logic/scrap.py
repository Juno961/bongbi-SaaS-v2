from .utils import parse_float_safe
from app.api.schemas import ValidationWarning
from typing import List, Dict


def calculate_scrap_metrics(data) -> Dict:
    """
    스크랩 계산 및 단순화된 유효성 검증
    actualProductWeight 입력 시 totalWeight도 함께 업데이트
    """
    total_weight = parse_float_safe(data.get("totalWeight"))  # kg (제품 총중량)
    total_cost = parse_float_safe(data.get("totalCost"))  # ₩
    quantity = parse_float_safe(data.get("quantity"))
    actual_product_weight_g = parse_float_safe(data.get("actualProductWeight"))  # g
    recovery_ratio = parse_float_safe(data.get("recoveryRatio"))  # %
    scrap_unit_price = parse_float_safe(data.get("scrapUnitPrice"))  # ₩/kg

    # actualProductWeight 입력 시 totalWeight 재계산
    updated_total_weight = total_weight
    total_actual_product_weight_kg = None
    
    if actual_product_weight_g is not None and actual_product_weight_g > 0 and quantity is not None and quantity > 0:
        # 실제 제품 중량 기준으로 제품 총중량 업데이트
        total_actual_product_weight_kg = (actual_product_weight_g * quantity) / 1000.0
        updated_total_weight = total_actual_product_weight_kg
    elif actual_product_weight_g is None or actual_product_weight_g <= 0:
        # 기존 totalWeight의 80%를 실제 제품 중량으로 가정
        total_actual_product_weight_kg = total_weight * 0.8 if total_weight else 0.0

    # 기본 반환값 (업데이트된 totalWeight 포함)
    default_result = {
        "scrapWeight": 0.0,
        "scrapSavings": 0.0,
        "realCost": total_cost,
        "unitCost": (total_cost / quantity) if quantity > 0 else 0.0,
        "updatedTotalWeight": updated_total_weight,  # 업데이트된 제품 총중량
        "totalActualProductWeight": total_actual_product_weight_kg,
        "warnings": []
    }

    # 스크랩 조건 검증
    if not validate_scrap_conditions(recovery_ratio, scrap_unit_price, actual_product_weight_g):
        return default_result

    # 단순화된 입력값 유효성 검증
    warnings = validate_scrap_inputs(data)
    
    # 심각한 오류가 있으면 계산 중단
    critical_errors = [w for w in warnings if w.type == "error"]
    if critical_errors:
        default_result["warnings"] = warnings
        return default_result

    # 스크랩 중량 계산 (봉재 총중량 - 실제 제품 총중량)
    # 여기서는 원래 materialTotalWeight를 사용해야 함
    material_total_weight = parse_float_safe(data.get("materialTotalWeight")) or total_weight
    scrap_weight = max(0.0, material_total_weight - total_actual_product_weight_kg) if total_actual_product_weight_kg else 0.0
    
    # 스크랩이 없는 경우
    if scrap_weight <= 0:
        default_result["warnings"] = warnings
        return default_result
    
    # 환산비율 제한 (100% 초과시 100%로 제한)
    if recovery_ratio > 100:
        recovery_ratio = 100.0
    
    # 스크랩 절약 금액 계산
    scrap_savings = scrap_weight * scrap_unit_price * (recovery_ratio / 100.0)
    
    # 실제 비용 계산
    real_cost = max(0.0, total_cost - scrap_savings)
    unit_cost = (real_cost / quantity) if quantity > 0 else 0.0

    return {
        "scrapWeight": scrap_weight,
        "scrapSavings": scrap_savings,
        "realCost": real_cost,
        "unitCost": unit_cost,
        "updatedTotalWeight": updated_total_weight,  # 업데이트된 제품 총중량
        "totalActualProductWeight": total_actual_product_weight_kg,
        "warnings": warnings
    }


def validate_scrap_conditions(recovery_ratio, scrap_unit_price, actual_product_weight_g) -> bool:
    """
    스크랩 조건 검증
    """
    conditions = [
        actual_product_weight_g is not None and actual_product_weight_g > 0,
        recovery_ratio is not None and recovery_ratio > 0,
        scrap_unit_price is not None and scrap_unit_price > 0
    ]
    return all(conditions)


def validate_scrap_inputs(data) -> List[ValidationWarning]:
    """
    단순화된 스크랩 검증 - 두 가지 경우만 경고:
    1. 실제 제품 중량 > 계산된 개별 제품 중량 (unit weight)
    2. 스크랩 환산 비율 > 100%
    """
    warnings = []
    
    total_weight = parse_float_safe(data.get("totalWeight"))  # 제품 총중량 (kg)
    quantity = parse_float_safe(data.get("quantity"))  # 수량
    actual_product_weight_g = parse_float_safe(data.get("actualProductWeight"))  # 실제 제품 중량 (g)
    recovery_ratio = parse_float_safe(data.get("recoveryRatio"))  # 환산 비율 (%)
    
    # 1. 실제 제품 중량 vs 계산된 개별 제품 중량 비교
    if (actual_product_weight_g is not None and actual_product_weight_g > 0 and 
        total_weight is not None and quantity is not None and quantity > 0):
        
        # 계산된 개별 제품 중량 (g) = (제품 총중량 kg * 1000) / 수량
        calculated_unit_weight_g = (total_weight * 1000) / quantity
        
        # 실제 제품 중량이 계산된 개별 제품 중량보다 큰 경우
        if actual_product_weight_g > calculated_unit_weight_g:
            warnings.append(ValidationWarning(
                type="warning",
                field="actualProductWeight",
                message=f"실제 제품 중량({actual_product_weight_g:.1f}g)이 계산된 개별 제품 중량({calculated_unit_weight_g:.1f}g)보다 큽니다.",
                suggestion="실제 제품 중량을 다시 확인하거나 측정해주세요."
            ))
    
    # 2. 스크랩 환산 비율 검증
    if recovery_ratio is not None and recovery_ratio > 100:
        warnings.append(ValidationWarning(
            type="error",
            field="recoveryRatio",
            message=f"스크랩 환산 비율이 100%를 초과합니다 ({recovery_ratio}%).",
            suggestion="100% 이하의 값을 입력하세요."
        ))
    
    return warnings


def calculate_scrap_efficiency_metrics(data) -> Dict:
    """
    스크랩 효율성 관련 추가 지표 계산
    """
    total_weight = parse_float_safe(data.get("totalWeight"))
    scrap_weight = parse_float_safe(data.get("scrapWeight"))
    scrap_savings = parse_float_safe(data.get("scrapSavings"))
    total_cost = parse_float_safe(data.get("totalCost"))
    
    metrics = {}
    
    # 스크랩 비율 계산
    if total_weight > 0:
        metrics["scrapRatio"] = round((scrap_weight / total_weight) * 100, 3)
    else:
        metrics["scrapRatio"] = 0.0
    
    # 비용 절감 비율 계산
    if total_cost > 0:
        metrics["costSavingsRatio"] = round((scrap_savings / total_cost) * 100, 2)
    else:
        metrics["costSavingsRatio"] = 0.0
    
    return metrics
