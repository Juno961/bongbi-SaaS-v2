from .utils import parse_float_safe


def validate_common_inputs(data):
    """
    공통 입력값 유효성 검증
    """
    warnings = []
    errors = []
    
    # 기본 필수값 검증
    quantity = parse_float_safe(data.get('quantity'))
    if quantity <= 0:
        errors.append("수량은 0보다 커야 합니다.")
    elif quantity > 100000:
        warnings.append("수량이 매우 큽니다. 계산 결과를 확인해주세요.")
    
    # 재료 정보 검증
    material_density = parse_float_safe(data.get('materialDensity'))
    if material_density <= 0:
        errors.append("재료 밀도는 0보다 커야 합니다.")
    elif material_density < 1000 or material_density > 20000:
        warnings.append("재료 밀도가 일반적인 범위(1000-20000 kg/m³)를 벗어납니다.")
    
    material_price = parse_float_safe(data.get('materialPrice'))
    if material_price <= 0:
        errors.append("재료 단가는 0보다 커야 합니다.")
    elif material_price > 50000:
        warnings.append("재료 단가가 매우 높습니다(50,000원/kg 초과).")
    
    return {"warnings": warnings, "errors": errors}


def validate_rod_specific_inputs(data):
    """
    봉재 특화 입력값 유효성 검증
    """
    warnings = []
    errors = []
    
    # 치수 검증
    shape = data.get('shape', '').lower()
    diameter = parse_float_safe(data.get('diameter'))
    width = parse_float_safe(data.get('width'))
    height = parse_float_safe(data.get('height'))
    
    if shape in ['circle', 'square', 'hexagon']:
        if diameter <= 0:
            errors.append(f"{shape} 형태에서 직경은 0보다 커야 합니다.")
        elif diameter > 500:
            warnings.append("직경이 500mm를 초과합니다. 대형 재료인지 확인해주세요.")
    elif shape == 'rectangle':
        if width <= 0 or height <= 0:
            errors.append("직사각형에서 폭과 높이는 모두 0보다 커야 합니다.")
        elif width > 500 or height > 500:
            warnings.append("폭 또는 높이가 500mm를 초과합니다. 대형 재료인지 확인해주세요.")
    
    # 길이 검증
    product_length = parse_float_safe(data.get('productLength'))
    if product_length <= 0:
        errors.append("제품 길이는 0보다 커야 합니다.")
    elif product_length > 10000:
        warnings.append("제품 길이가 10m를 초과합니다.")
    
    standard_bar_length = parse_float_safe(data.get('standardBarLength'))
    if standard_bar_length <= 0:
        errors.append("표준 봉재 길이는 0보다 커야 합니다.")
    elif standard_bar_length < product_length:
        errors.append("표준 봉재 길이가 제품 길이보다 짧습니다.")
    
    # 절단 관련 검증
    cutting_loss = parse_float_safe(data.get('cuttingLoss'))
    head_cut = parse_float_safe(data.get('headCut'))
    tail_cut = parse_float_safe(data.get('tailCut'))
    
    if cutting_loss < 0:
        errors.append("절단 손실은 음수일 수 없습니다.")
    elif cutting_loss > product_length:
        warnings.append("절단 손실이 제품 길이보다 큽니다.")
    
    if head_cut < 0 or tail_cut < 0:
        errors.append("헤드컷과 테일컷은 음수일 수 없습니다.")
    
    total_cut = head_cut + tail_cut
    if total_cut >= standard_bar_length:
        errors.append("헤드컷과 테일컷의 합이 표준 봉재 길이 이상입니다.")
    elif total_cut > standard_bar_length * 0.3:
        warnings.append("헤드컷과 테일컷의 합이 표준 봉재 길이의 30%를 초과합니다.")
    
    return {"warnings": warnings, "errors": errors}


def validate_plate_specific_inputs(data):
    """
    판재 특화 입력값 유효성 검증
    """
    warnings = []
    errors = []
    
    # 판재 치수 검증
    thickness = parse_float_safe(data.get('plateThickness'))
    width = parse_float_safe(data.get('plateWidth'))
    length = parse_float_safe(data.get('plateLength'))
    
    if thickness <= 0:
        errors.append("판재 두께는 0보다 커야 합니다.")
    elif thickness < 0.5:
        warnings.append("판재 두께가 0.5mm 미만입니다. 얇은 판재인지 확인해주세요.")
    elif thickness > 100:
        warnings.append("판재 두께가 100mm를 초과합니다. 두꺼운 판재인지 확인해주세요.")
    
    if width <= 0:
        errors.append("판재 폭은 0보다 커야 합니다.")
    elif width > 3000:
        warnings.append("판재 폭이 3m를 초과합니다.")
    
    if length <= 0:
        errors.append("판재 길이는 0보다 커야 합니다.")
    elif length > 12000:
        warnings.append("판재 길이가 12m를 초과합니다.")
    
    # 판재 단가 검증
    plate_unit_price = parse_float_safe(data.get('plateUnitPrice'))
    if plate_unit_price <= 0:
        errors.append("판재 단가는 0보다 커야 합니다.")
    
    return {"warnings": warnings, "errors": errors}


def validate_calculation_results(results, material_type="rod"):
    """
    계산 결과의 논리적 유효성 검증
    """
    warnings = []
    
    if not results:
        return warnings
    
    # 활용률 검증
    utilization_rate = results.get('utilizationRate', 0)
    if utilization_rate > 100:
        warnings.append(f"활용률이 100%를 초과했습니다 ({utilization_rate:.1f}%). 계산 로직을 확인해주세요.")
    elif utilization_rate < 30 and material_type == "rod":
        warnings.append(f"활용률이 낮습니다 ({utilization_rate:.1f}%). 절단 방법을 최적화할 수 있습니다.")
    
    # 손실률 검증
    wastage = results.get('wastage', 0)
    if wastage > 70:
        warnings.append(f"손실률이 매우 높습니다 ({wastage:.1f}%). 치수를 재검토해주세요.")
    
    # 중량 검증
    total_weight = results.get('totalWeight', 0)
    if total_weight <= 0:
        warnings.append("총 중량이 0 이하입니다. 입력값을 확인해주세요.")
    elif total_weight > 10000:
        warnings.append("총 중량이 10톤을 초과합니다. 대량 주문인지 확인해주세요.")
    
    # 비용 검증
    total_cost = results.get('totalCost', 0)
    unit_cost = results.get('unitCost', 0)
    
    if total_cost <= 0:
        warnings.append("총 비용이 0 이하입니다.")
    elif total_cost > 50000000:  # 5천만원
        warnings.append("총 비용이 5천만원을 초과합니다.")
    
    if unit_cost <= 0:
        warnings.append("개당 단가가 0 이하입니다.")
    elif unit_cost > 1000000:  # 100만원
        warnings.append("개당 단가가 100만원을 초과합니다.")
    
    # 스크랩 관련 검증
    scrap_savings = results.get('scrapSavings', 0)
    if scrap_savings > total_cost * 0.8:
        warnings.append("스크랩 절약 금액이 총 비용의 80%를 초과합니다. 입력값을 확인해주세요.")
    
    scrap_weight = results.get('scrapWeight', 0)
    if scrap_weight > total_weight * 0.5:
        warnings.append("스크랩 중량이 총 중량의 50%를 초과합니다. 비효율적인 가공입니다.")
    
    return warnings


def generate_optimization_suggestions(data, results, material_type="rod"):
    """
    계산 결과를 바탕으로 최적화 제안 생성
    """
    suggestions = []
    
    if not results:
        return suggestions
    
    utilization_rate = results.get('utilizationRate', 0)
    wastage = results.get('wastage', 0)
    
    if material_type == "rod":
        # 봉재 최적화 제안
        if utilization_rate < 60:
            suggestions.append("활용률 개선을 위해 표준 봉재 길이를 조정하거나 절단 계획을 최적화해보세요.")
        
        if wastage > 30:
            suggestions.append("손실률이 높습니다. 헤드컷/테일컷을 줄이거나 다른 길이의 표준재를 고려해보세요.")
        
        head_cut = parse_float_safe(data.get('headCut'))
        tail_cut = parse_float_safe(data.get('tailCut'))
        standard_length = parse_float_safe(data.get('standardBarLength'))
        
        if (head_cut + tail_cut) > standard_length * 0.1:
            suggestions.append("헤드컷과 테일컷이 표준 길이의 10%를 초과합니다. 절단 방법을 개선할 수 있습니다.")
    
    # 스크랩 최적화 제안
    scrap_weight = results.get('scrapWeight', 0)
    total_weight = results.get('totalWeight', 0)
    
    if scrap_weight > 0 and total_weight > 0:
        scrap_ratio = (scrap_weight / total_weight) * 100
        if scrap_ratio > 20:
            suggestions.append("스크랩 비율이 20%를 초과합니다. 설계를 최적화하여 재료 사용량을 줄여보세요.")
        elif scrap_ratio > 0:
            suggestions.append("발생하는 스크랩을 활용하여 비용을 절감할 수 있습니다.")
    
    # 경제성 제안
    unit_cost = results.get('unitCost', 0)
    if unit_cost > 0:
        if unit_cost < 1000:
            suggestions.append("단가가 낮아 경제적입니다. 대량 생산을 고려해보세요.")
        elif unit_cost > 100000:
            suggestions.append("단가가 높습니다. 재료나 가공 방법을 재검토해보세요.")
    
    return suggestions


def create_validation_summary(data, results, material_type="rod"):
    """
    전체 유효성 검증 결과 요약
    """
    all_warnings = []
    all_errors = []
    
    # 공통 입력값 검증
    common_validation = validate_common_inputs(data)
    all_warnings.extend(common_validation["warnings"])
    all_errors.extend(common_validation["errors"])
    
    # 재료별 특화 검증
    if material_type == "rod":
        rod_validation = validate_rod_specific_inputs(data)
        all_warnings.extend(rod_validation["warnings"])
        all_errors.extend(rod_validation["errors"])
    else:
        plate_validation = validate_plate_specific_inputs(data)
        all_warnings.extend(plate_validation["warnings"])
        all_errors.extend(plate_validation["errors"])
    
    # 계산 결과 검증
    if results:
        result_warnings = validate_calculation_results(results, material_type)
        all_warnings.extend(result_warnings)
        
        # 최적화 제안
        suggestions = generate_optimization_suggestions(data, results, material_type)
    else:
        suggestions = []
    
    return {
        "errors": all_errors,
        "warnings": all_warnings,
        "suggestions": suggestions,
        "has_critical_issues": len(all_errors) > 0,
        "validation_passed": len(all_errors) == 0
    }
