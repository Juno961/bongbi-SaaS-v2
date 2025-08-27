from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from app.api.schemas import (
    RodCalculateRequest, RodCalculateResponse,
    PlateCalculateRequest, PlateCalculateResponse,
    ScrapCalculateRequest, ScrapCalculateResponse,
    ErrorResponse, ValidationWarning, LegacyFieldSupport
)
from core_logic.rod import (
    calculate_cross_sectional_area, calculate_bars_needed, calculate_material_total_weight,
    calculate_product_total_weight, calculate_utilization_rate, calculate_total_cost, 
    calculate_unit_cost, calculate_wastage, validate_rod_calculation
)
from core_logic.plate import (
    calculate_plate_weight, calculate_plate_cost, calculate_unit_cost as plate_unit_cost,
    calculate_utilization_rate as plate_utilization_rate, calculate_wastage as plate_wastage,
    calculate_scrap_savings as plate_scrap_savings
)
from core_logic.scrap import calculate_scrap_metrics, calculate_scrap_efficiency_metrics

router = APIRouter()

@router.post('/calculate/rod', response_model=RodCalculateResponse, response_model_exclude_none=True, responses={400: {"model": ErrorResponse}})
async def calculate_rod(request: RodCalculateRequest):
    """봉재 계산 API - 컬럼마스터 v2.1 기준 + 검증 시스템"""
    data = request.dict()
    
    # 컬럼마스터 별칭 지원
    data = LegacyFieldSupport.apply_aliases(data)
    
    try:
        # 1. 사전 입력값 검증 (컬럼마스터 기준)
        input_warnings = validate_rod_calculation(data)
        
        # 심각한 오류가 있으면 계산 중단
        critical_errors = [w for w in input_warnings if w.type == "error"]
        if critical_errors:
            error_message = "입력값 오류: " + "; ".join([w.message for w in critical_errors])
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    status_code=400, 
                    message=error_message,
                    suggestions=[w.suggestion for w in critical_errors if w.suggestion]
                ).model_dump()
            )
        
        # 2. 계산 수행
        bars_needed = calculate_bars_needed(data)
        data['barsNeeded'] = bars_needed
        
        # 봉재가 필요하지 않은 경우 (계산 불가능한 조건)
        if bars_needed <= 0:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    status_code=400, 
                    message="계산 불가능: 제품 길이가 사용 가능한 봉재 길이보다 큽니다.",
                    suggestions=["제품 길이를 줄이거나", "절단 손실을 줄이거나", "더 긴 표준 봉재를 사용하세요"]
                ).model_dump()
            )
        
        material_total_weight = calculate_material_total_weight(data)
        data['materialTotalWeight'] = material_total_weight
        
        product_total_weight = calculate_product_total_weight(data)
        data['totalWeight'] = product_total_weight
        total_cost = calculate_total_cost(data)
        data['totalCost'] = total_cost
        
        # 활용률 계산 (컬럼마스터 제약조건: 0-100% 범위)
        utilization_rate = calculate_utilization_rate(data)
        data['utilizationRate'] = utilization_rate
        wastage = calculate_wastage(data)

        # 스크랩 계산 (컬럼마스터 scrap_condition 검증)
        scrap_result = calculate_scrap_metrics(data)
        scrap_weight = scrap_result.get('scrapWeight', 0.0)
        scrap_savings = scrap_result.get('scrapSavings', 0.0)
        real_cost = scrap_result.get('realCost', total_cost)
        scrap_warnings = scrap_result.get('warnings', [])
        
        # 스크랩 계산에서 업데이트된 제품 총중량 적용
        updated_total_weight = scrap_result.get('updatedTotalWeight')
        if updated_total_weight is not None:
            product_total_weight = updated_total_weight
            data['totalWeight'] = product_total_weight  # 데이터도 업데이트
        
        # 개당 단가는 항상 원재료 기준(스크랩 미반영)
        unit_cost = calculate_unit_cost(data)

        # 모든 경고 메시지 통합
        all_warnings = input_warnings + scrap_warnings
        
        # 새로운 필드 계산
        is_plate = False
        total_actual_product_weight = scrap_result.get('totalActualProductWeight')

        response = RodCalculateResponse(
            barsNeeded=bars_needed,
            materialTotalWeight=material_total_weight,
            totalWeight=product_total_weight,
            totalCost=total_cost,
            unitCost=unit_cost,
            utilizationRate=utilization_rate,
            wastage=wastage,
            scrapWeight=scrap_weight,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            isPlate=is_plate,
            totalActualProductWeight=total_actual_product_weight,
            warnings=all_warnings,
            suggestions=[]  # 최적화 제안 삭제
        )
        
        # 경고가 있으면 로그에 기록
        if all_warnings:
            print(f"Rod calculation warnings: {[w.message for w in all_warnings]}")
        
        return response
        
    except Exception as e:
        print(f"Rod calculation error: {str(e)}")
        return JSONResponse(
            status_code=400, 
            content=ErrorResponse(
                status_code=400, 
                message=f"계산 오류: {str(e)}",
                suggestions=["입력값을 확인하고 다시 시도해주세요"]
            ).model_dump()
        )

@router.post('/calculate/plate', response_model=PlateCalculateResponse, response_model_exclude_none=True, responses={400: {"model": ErrorResponse}})
async def calculate_plate(request: PlateCalculateRequest):
    """판재 계산 API - 컬럼마스터 v2.1 기준 + 검증 시스템"""
    data = request.dict()
    
    # 컬럼마스터 별칭 지원
    data = LegacyFieldSupport.apply_aliases(data)
    
    try:
        # 1. 입력값 검증 (판재 특화)
        warnings = []
        
        # 기본 제약조건 검증
        from core_logic.validation_utils import validate_plate_specific_inputs
        plate_validation = validate_plate_specific_inputs(data)
        warnings.extend(plate_validation["warnings"])
        
        # 심각한 오류가 있으면 계산 중단
        errors = plate_validation["errors"]
        if errors:
            error_message = "입력값 오류: " + "; ".join(errors)
            return JSONResponse(
                status_code=400, 
                content=ErrorResponse(
                    status_code=400, 
                    message=error_message,
                    suggestions=["입력값을 확인하고 다시 시도해주세요"]
                ).model_dump()
            )
        
        # 2. 계산 수행
        total_weight = calculate_plate_weight(data)
        data['totalWeight'] = total_weight
        total_cost = calculate_plate_cost(data)
        data['totalCost'] = total_cost
        unit_cost = plate_unit_cost(data)
        utilization_rate = plate_utilization_rate(data)  # 판재는 100%
        wastage = plate_wastage(data)  # 판재는 0%
        
        # 판재는 스크랩 관련 값을 계산하지 않음 → 기본값
        scrap_savings = 0.0
        real_cost = total_cost

        # 새로운 필드 계산
        is_plate = True
        total_actual_product_weight = None

        response = PlateCalculateResponse(
            totalWeight=total_weight,
            totalCost=total_cost,
            unitCost=unit_cost,
            utilizationRate=utilization_rate,
            wastage=wastage,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            isPlate=is_plate,
            totalActualProductWeight=total_actual_product_weight,
            warnings=[ValidationWarning(type="info", field=None, message=w, suggestion=None) for w in warnings],
            suggestions=[]  # 최적화 제안 삭제
        )
        
        # 경고가 있으면 로그에 기록
        if warnings:
            print(f"Plate calculation warnings: {warnings}")
        
        return response
        
    except Exception as e:
        print(f"Plate calculation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"계산 오류: {str(e)}")

@router.post('/calculate/scrap', response_model=ScrapCalculateResponse, response_model_exclude_none=True, responses={400: {"model": ErrorResponse}})
async def calculate_scrap(request: ScrapCalculateRequest):
    """스크랩 계산 API - 컬럼마스터 v2.1 기준"""
    data = request.dict()
    
    try:
        scrap_result = calculate_scrap_metrics(data)
        scrap_weight = scrap_result.get('scrapWeight', 0.0)
        scrap_savings = scrap_result.get('scrapSavings', 0.0)
        real_cost = scrap_result.get('realCost') if scrap_result.get('realCost') is not None else data.get('totalCost', 0.0)
        unit_cost = scrap_result.get('unitCost', 0.0)
        warnings = scrap_result.get('warnings', [])
        
        # 업데이트된 제품 총중량 및 실제 제품 총중량 추가
        updated_total_weight = scrap_result.get('updatedTotalWeight')
        total_actual_product_weight = scrap_result.get('totalActualProductWeight')
        
        response = ScrapCalculateResponse(
            scrapWeight=scrap_weight,
            scrapSavings=scrap_savings,
            realCost=real_cost,
            unitCost=unit_cost,
            updatedTotalWeight=updated_total_weight,  # 업데이트된 제품 총중량
            totalActualProductWeight=total_actual_product_weight,  # 실제 제품 총중량
            warnings=warnings
        )
        
        # 경고가 있으면 로그에 기록
        if warnings:
            print(f"Scrap calculation warnings: {[w.message for w in warnings]}")
        
        return response
        
    except Exception as e:
        print(f"Scrap calculation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"스크랩 계산 오류: {str(e)}")

@router.get('/health')
async def health():
    return {"status": "ok", "version": "v2.1", "column_master_compliant": True}

@router.post('/validate')
async def validate_inputs(data: dict):
    """
    계산 전 입력값 유효성 검증 전용 엔드포인트 - 컬럼마스터 v2.1 기준
    """
    try:
        # 컬럼마스터 별칭 지원
        data = LegacyFieldSupport.apply_aliases(data)
        
        material_type = "rod" if data.get('shape') else "plate"
        
        if material_type == "rod":
            warnings = validate_rod_calculation(data)
            errors = [w.message for w in warnings if w.type == "error"]
            warning_messages = [w.message for w in warnings if w.type == "warning"]
            suggestions = [w.suggestion for w in warnings if w.suggestion]
        else:
            from core_logic.validation_utils import validate_plate_specific_inputs
            validation_result = validate_plate_specific_inputs(data)
            errors = validation_result["errors"]
            warning_messages = validation_result["warnings"]
            suggestions = ["판재 규격을 확인해주세요"] if errors else []
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warning_messages,
            "suggestions": suggestions,
            "column_master_version": "v2.1"
        }
    except Exception as e:
        return {
            "valid": False,
            "errors": [f"검증 중 오류 발생: {str(e)}"],
            "warnings": [],
            "suggestions": ["입력값을 확인하고 다시 시도해주세요"]
        }
