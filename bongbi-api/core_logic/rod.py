from .utils import parse_float_safe, kg_per_m3_to_g_per_cm3
from app.api.schemas import ValidationWarning, ConstraintValidator
from typing import List, Dict
import math

# 1. 단면적 계산
def calculate_cross_sectional_area(data):
    shape = data.get('shape', '').lower()
    diameter = parse_float_safe(data.get('diameter'))
    width = parse_float_safe(data.get('width'))
    height = parse_float_safe(data.get('height'))
    
    if shape == 'circle':
        return math.pi * (diameter / 2) ** 2
    elif shape == 'square':
        return diameter ** 2
    elif shape == 'rectangle':
        return width * height
    elif shape == 'hexagon':
        return (3 * math.sqrt(3) / 8) * diameter ** 2
    else:
        return 0.0

# 2. 봉재 필요 개수 계산
def calculate_bars_needed(data):
    product_length = parse_float_safe(data.get('productLength'))
    cutting_loss = parse_float_safe(data.get('cuttingLoss'))
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    head_cut = parse_float_safe(data.get('headCut'))
    tail_cut = parse_float_safe(data.get('tailCut'))
    quantity = parse_float_safe(data.get('quantity'))
    
    # 입력값 유효성 검증
    if product_length <= 0 or quantity <= 0 or standard_bar_length <= 0:
        return 0
    
    unit_length = product_length + cutting_loss
    usable_length = standard_bar_length - head_cut - tail_cut
    
    # 사용 가능한 길이가 단위 길이보다 작으면 계산 불가
    if usable_length <= 0 or unit_length > usable_length:
        return 0
    
    pieces_per_bar = math.floor(usable_length / unit_length)
    if pieces_per_bar <= 0:
        return 0
    
    bars_needed = math.ceil(quantity / pieces_per_bar)
    return int(bars_needed)

# 3. 봉재 총 중량 계산 (컬럼마스터: materialTotalWeight)
def calculate_material_total_weight(data):
    area = calculate_cross_sectional_area(data)
    bars_needed = parse_float_safe(data.get('barsNeeded'))
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    material_density_kg_per_m3 = parse_float_safe(data.get('materialDensity'))
    
    # 입력값 유효성 검증
    if area <= 0 or bars_needed <= 0 or standard_bar_length <= 0 or material_density_kg_per_m3 <= 0:
        return 0.0
    
    # 컬럼마스터 단위 정책: kg/m³ → g/cm³ 변환
    material_density = kg_per_m3_to_g_per_cm3(material_density_kg_per_m3)
    
    total_bar_length = bars_needed * standard_bar_length
    volume = area * total_bar_length  # mm^3
    volume_cm3 = volume / 1000.0
    total_weight = (volume_cm3 * material_density) / 1000.0  # kg
    
    return total_weight if total_weight > 0 else 0.0

# 4. 제품 총 중량 계산 (컬럼마스터: totalWeight)
def calculate_product_total_weight(data):
    quantity = parse_float_safe(data.get('quantity'))
    product_weight_g = parse_float_safe(data.get('productWeight'))  # g 단위 (선택사항)
    
    # 입력값 유효성 검증
    if quantity <= 0:
        return 0.0
    
    # productWeight가 제공된 경우 사용
    if product_weight_g is not None and product_weight_g > 0:
        # 제품 총 중량 계산 (g → kg 변환)
        total_product_weight_kg = (quantity * product_weight_g) / 1000.0
        return total_product_weight_kg if total_product_weight_kg > 0 else 0.0
    
    # productWeight가 없으면 치수로부터 계산
    area = calculate_cross_sectional_area(data)
    product_length = parse_float_safe(data.get('productLength'))
    material_density_kg_per_m3 = parse_float_safe(data.get('materialDensity'))
    
    if area <= 0 or product_length <= 0 or material_density_kg_per_m3 <= 0:
        return 0.0
    
    # 컬럼마스터 단위 정책: kg/m³ → g/cm³ 변환
    material_density = kg_per_m3_to_g_per_cm3(material_density_kg_per_m3)
    
    # 개별 제품 중량 계산 (g)
    volume_mm3 = area * product_length  # mm³
    volume_cm3 = volume_mm3 / 1000.0
    individual_product_weight_g = volume_cm3 * material_density  # g
    
    # 제품 총 중량 계산 (g → kg 변환)
    total_product_weight_kg = (quantity * individual_product_weight_g) / 1000.0
    
    return total_product_weight_kg if total_product_weight_kg > 0 else 0.0

# 5. 절단 효율 계산 (수정됨 - 100% 초과 방지)
def calculate_utilization_rate(data):
    product_length = parse_float_safe(data.get('productLength'))
    cutting_loss = parse_float_safe(data.get('cuttingLoss'))
    head_cut = parse_float_safe(data.get('headCut'))
    tail_cut = parse_float_safe(data.get('tailCut'))
    quantity = parse_float_safe(data.get('quantity'))
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    bars_needed = parse_float_safe(data.get('barsNeeded'))
    
    # 입력값 유효성 검증
    if quantity <= 0 or bars_needed <= 0 or standard_bar_length <= 0:
        return 0.0
    
    # 실제 사용된 길이 계산 (절단 손실 포함)
    unit_length = product_length + cutting_loss
    total_used_length = quantity * unit_length
    
    # 사용 가능한 총 길이 계산
    usable_length_per_bar = standard_bar_length - head_cut - tail_cut
    total_usable_length = bars_needed * usable_length_per_bar
    
    if total_usable_length <= 0:
        return 0.0
    
    # 활용률 계산 (컬럼마스터 제약조건: 0-100% 범위)
    utilization_rate = min((total_used_length / total_usable_length) * 100.0, 100.0)
    
    return utilization_rate if utilization_rate > 0 else 0.0

# 6. 총 재료비 계산
def calculate_total_cost(data):
    material_total_weight = parse_float_safe(data.get('materialTotalWeight'))
    material_price = parse_float_safe(data.get('materialPrice'))
    
    # 입력값 유효성 검증
    if material_total_weight <= 0 or material_price <= 0:
        return 0.0
    
    total_cost = material_total_weight * material_price
    return total_cost

# 7. 개당 단가 계산
def calculate_unit_cost(data):
    total_cost = parse_float_safe(data.get('totalCost'))
    quantity = parse_float_safe(data.get('quantity'))
    
    if quantity <= 0 or total_cost <= 0:
        return 0.0
    
    unit_cost = total_cost / quantity
    return unit_cost

# 8. 손실률 계산
def calculate_wastage(data):
    utilization_rate = parse_float_safe(data.get('utilizationRate'))
    
    # 컬럼마스터 제약조건 준수: 0-100% 범위
    if utilization_rate < 0:
        utilization_rate = 0
    elif utilization_rate > 100:
        utilization_rate = 100
    
    wastage = 100.0 - utilization_rate
    return max(wastage, 0.0)

# 9. 단순화된 검증 함수 (두 가지 경우만 경고)
def validate_rod_calculation(data) -> List[ValidationWarning]:
    """
    봉재 계산의 단순화된 유효성 검증 - 두 가지 경우만 경고
    1. 실제 제품 중량 > 계산된 제품 중량
    2. 스크랩 환산 비율 > 100%
    """
    warnings = []
    
    # 1. 스크랩 환산 비율 검증
    recovery_ratio = parse_float_safe(data.get('recoveryRatio'))
    if recovery_ratio is not None and recovery_ratio > 100:
        warnings.append(ValidationWarning(
            type="error",
            field="recoveryRatio",
            message=f"스크랩 환산 비율이 100%를 초과합니다 ({recovery_ratio}%).",
            suggestion="100% 이하의 값을 입력하세요."
        ))
    
    # 2. 제품 중량 비교는 scrap.py에서 처리됨
    
    return warnings
