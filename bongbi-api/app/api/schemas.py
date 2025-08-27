from typing import Optional, List
from pydantic import BaseModel, Field, conint, confloat, model_validator, EmailStr
from datetime import datetime


class RodCalculateRequest(BaseModel):
    """봉재 계산 요청 - 컬럼마스터 v2.2 기준"""
    productWeight: Optional[confloat(ge=0)] = Field(None, description="제품 1개의 예상 중량 (g)")
    materialType: Optional[str] = Field(None, description="재질 유형 (rod 또는 sheet)")
    shape: str = Field(..., description="봉재 형상 종류 (circle, hexagon, square, rectangle)")
    diameter: Optional[confloat(ge=0)] = Field(None, description="원형/육각형/정사각형의 직경 (mm)")
    width: Optional[confloat(ge=0)] = Field(None, description="직사각형(봉재) 가로 (mm)")
    height: Optional[confloat(ge=0)] = Field(None, description="직사각형(봉재) 세로 (mm)")
    productLength: confloat(gt=0) = Field(..., description="봉재 가공 시 제품 길이 (mm)")
    quantity: conint(ge=1) = Field(..., description="총 제작 수량 (개)")
    cuttingLoss: confloat(ge=0) = Field(0, description="절단 시 손실되는 길이 (mm)")
    headCut: confloat(ge=0) = Field(0, description="봉재 선단 가공 손실 (mm)")
    tailCut: confloat(ge=0) = Field(0, description="봉재 후단 가공 손실 (mm)")
    standardBarLength: confloat(gt=0) = Field(..., description="표준 봉재 길이 (mm)")
    materialDensity: confloat(gt=0) = Field(..., description="재질의 밀도 (kg/m³)")
    materialPrice: confloat(ge=0) = Field(..., description="봉재의 kg당 단가 (₩/kg)")
    actualProductWeight: Optional[confloat(ge=0)] = Field(None, description="사용자가 입력하는 제품 1개 실제 중량 (g)")
    recoveryRatio: Optional[confloat(ge=0, le=100)] = Field(None, description="스크랩 환산율 (%)")
    scrapUnitPrice: Optional[confloat(ge=0)] = Field(None, description="스크랩 회수 단가 (₩/kg)")

    @model_validator(mode="after")
    def validate_shape_dimensions(self) -> "RodCalculateRequest":
        shape_lower = (self.shape or "").lower()
        if shape_lower == "rectangle":
            if self.width is None or self.height is None:
                raise ValueError("직사각형의 경우 가로와 세로가 필요합니다")
        elif shape_lower in ["circle", "hexagon", "square"]:
            if self.diameter is None:
                raise ValueError(f"{shape_lower} 형상의 경우 직경이 필요합니다")
        return self


class PlateCalculateRequest(BaseModel):
    """판재 계산 요청 - 컬럼마스터 v2.1 기준"""
    materialType: Optional[str] = Field(None, description="재질 유형 (rod 또는 sheet)")
    plateThickness: confloat(gt=0) = Field(..., description="판재의 두께 (mm)")
    plateWidth: confloat(gt=0) = Field(..., description="판재의 폭 (mm)")
    plateLength: confloat(gt=0) = Field(..., description="판재의 길이 (mm)")
    quantity: conint(ge=1) = Field(..., description="총 제작 수량 (개)")
    materialDensity: confloat(gt=0) = Field(..., description="재질의 밀도 (kg/m³)")
    plateUnitPrice: confloat(ge=0) = Field(..., description="판재의 kg당 단가 (₩/kg)")


class ScrapCalculateRequest(BaseModel):
    """스크랩 계산 요청 - 컬럼마스터 v2.1 기준"""
    totalWeight: confloat(ge=0) = Field(..., description="전체 제품의 총 중량 (kg)")
    totalCost: confloat(ge=0) = Field(..., description="전체 생산에 필요한 재료비 (₩)")
    quantity: conint(ge=1) = Field(..., description="총 제작 수량 (개)")
    actualProductWeight: confloat(ge=0) = Field(..., description="사용자가 입력하는 제품 1개 실제 중량 (g)")
    recoveryRatio: confloat(gt=0, le=100) = Field(..., description="스크랩 환산율 (%)")
    scrapUnitPrice: confloat(gt=0) = Field(..., description="스크랩 회수 단가 (₩/kg)")


class ValidationWarning(BaseModel):
    """검증 경고 메시지"""
    type: str = Field(..., description="경고 유형 (warning, error, info)")
    field: Optional[str] = Field(None, description="관련 필드명")
    message: str = Field(..., description="경고 메시지")
    suggestion: Optional[str] = Field(None, description="개선 제안")


class RodCalculateResponse(BaseModel):
    """봉재 계산 응답 - 컬럼마스터 v2.2 기준 + 검증 기능"""
    barsNeeded: int = Field(..., description="필요한 봉재 수량 (개)")
    materialTotalWeight: float = Field(..., description="필요한 모든 봉재의 총 중량 (kg)")
    totalWeight: float = Field(..., description="전체 제품의 총 중량 (kg)")
    totalCost: float = Field(..., description="전체 생산에 필요한 재료비 (₩)")
    unitCost: float = Field(..., description="제품 1개당 재료 단가 (₩)")
    utilizationRate: float = Field(..., description="자재 사용 효율 (%)")
    wastage: float = Field(..., description="자재 사용 손실률 (%)")
    scrapWeight: float = Field(0.0, description="제품 생산 후 남은 재활용 가능한 자투리 자재량 (kg)")
    scrapSavings: float = Field(0.0, description="스크랩 회수로 절약된 금액 (₩)")
    realCost: float = Field(..., description="총 재료비에서 스크랩 절감액을 차감한 실제 재료비 (₩)")
    isPlate: bool = Field(False, description="판재 여부")
    totalActualProductWeight: Optional[float] = Field(None, description="실제 제품 1개 중량 × 수량의 합 (kg)")
    warnings: List[ValidationWarning] = Field(default_factory=list, description="검증 경고 메시지 목록")
    suggestions: List[str] = Field(default_factory=list, description="최적화 제안 목록")


class PlateCalculateResponse(BaseModel):
    """판재 계산 응답 - 컬럼마스터 v2.1 기준 + 검증 기능"""
    totalWeight: float = Field(..., description="전체 판재의 총 중량 (kg)")
    totalCost: float = Field(..., description="전체 생산에 필요한 재료비 (₩)")
    unitCost: float = Field(..., description="제품 1개당 재료 단가 (₩)")
    utilizationRate: float = Field(..., description="자재 사용 효율 (%) - 판재는 100%")
    wastage: float = Field(..., description="자재 사용 손실률 (%) - 판재는 0%")
    scrapSavings: float = Field(0.0, description="스크랩 회수로 절약된 금액 (₩)")
    realCost: float = Field(..., description="총 재료비에서 스크랩 절감액을 차감한 실제 재료비 (₩)")
    isPlate: bool = Field(True, description="판재 여부")
    totalActualProductWeight: Optional[float] = Field(None, description="실제 제품 1개 중량 × 수량의 합 (kg)")
    warnings: List[ValidationWarning] = Field(default_factory=list, description="검증 경고 메시지 목록")
    suggestions: List[str] = Field(default_factory=list, description="최적화 제안 목록")


class ScrapCalculateResponse(BaseModel):
    """스크랩 계산 응답 - 컬럼마스터 v2.1 기준"""
    scrapWeight: float = Field(..., description="제품 생산 후 남은 재활용 가능한 자투리 자재량 (kg)")
    scrapSavings: float = Field(..., description="스크랩 회수로 절약된 금액 (₩)")
    realCost: float = Field(..., description="총 재료비에서 스크랩 절감액을 차감한 실제 재료비 (₩)")
    unitCost: float = Field(..., description="제품 1개당 재료 단가 (₩)")
    updatedTotalWeight: Optional[float] = Field(None, description="업데이트된 제품 총중량 (kg) - actualProductWeight 입력 시")
    totalActualProductWeight: Optional[float] = Field(None, description="실제 제품 1개 중량 × 수량의 합 (kg)")
    warnings: List[ValidationWarning] = Field(default_factory=list, description="검증 경고 메시지 목록")


class ErrorResponse(BaseModel):
    """오류 응답 - 컬럼마스터 v2.1 기준"""
    status_code: int = Field(..., description="HTTP 상태 코드")
    message: str = Field(..., description="오류 메시지")
    detail: Optional[str] = Field(None, description="상세 오류 내용")
    field: Optional[str] = Field(None, description="오류 관련 필드명")
    suggestions: List[str] = Field(default_factory=list, description="해결 방안 제안")


# 컬럼마스터 정책 준수를 위한 별칭 지원
class LegacyFieldSupport:
    """컬럼마스터의 aliases 지원을 위한 필드 매핑"""
    FIELD_ALIASES = {
        # API 요청 시 별칭 지원
        "scrapPrice": "scrapUnitPrice",
        "thickness": "plateThickness", 
        "width_plate": "plateWidth",
        "length_plate": "plateLength",
        
        # API 응답 시 별칭 지원
        "materialCost": "totalCost",
        "costPerPiece": "unitCost",
    }
    
    @classmethod
    def resolve_alias(cls, field_name: str) -> str:
        """별칭을 실제 필드명으로 변환"""
        return cls.FIELD_ALIASES.get(field_name, field_name)
    
    @classmethod
    def apply_aliases(cls, data: dict) -> dict:
        """딕셔너리에서 별칭을 실제 필드명으로 변환"""
        resolved_data = {}
        for key, value in data.items():
            resolved_key = cls.resolve_alias(key)
            resolved_data[resolved_key] = value
        return resolved_data


# 컬럼마스터 단위 정책 준수
class UnitPolicy:
    """컬럼마스터 단위 정책 구현"""
    
    # 밀도 변환: kg/m³ ↔ g/cm³
    @staticmethod
    def kg_per_m3_to_g_per_cm3(density_kg_m3: float) -> float:
        """kg/m³ → g/cm³ 변환"""
        return density_kg_m3 / 1000.0
    
    @staticmethod 
    def g_per_cm3_to_kg_per_m3(density_g_cm3: float) -> float:
        """g/cm³ → kg/m³ 변환"""
        return density_g_cm3 * 1000.0
    
    # 중량 변환: g ↔ kg
    @staticmethod
    def g_to_kg(weight_g: float) -> float:
        """g → kg 변환"""
        return weight_g / 1000.0
    
    @staticmethod
    def kg_to_g(weight_kg: float) -> float:
        """kg → g 변환"""
        return weight_kg * 1000.0


# 컬럼마스터 제약 조건 검증
class ConstraintValidator:
    """컬럼마스터 제약 조건 검증"""
    
    @staticmethod
    def validate_percentage(value: float, field_name: str) -> List[ValidationWarning]:
        """퍼센트 값 검증 (0-100%)"""
        warnings = []
        if value < 0:
            warnings.append(ValidationWarning(
                type="error",
                field=field_name,
                message=f"{field_name}은 음수일 수 없습니다.",
                suggestion="0 이상의 값을 입력하세요."
            ))
        elif value > 100:
            warnings.append(ValidationWarning(
                type="warning", 
                field=field_name,
                message=f"{field_name}이 100%를 초과합니다 ({value:.1f}%).",
                suggestion="일반적으로 100% 이하의 값을 사용합니다."
            ))
        return warnings


# 노션 연동 관련 스키마
class CustomerInquiryRequest(BaseModel):
    """고객 문의 요청 스키마"""
    name: str = Field(..., min_length=1, max_length=100, description="문의자 이름")
    email: EmailStr = Field(..., description="문의자 이메일")
    subject: str = Field(..., min_length=1, max_length=200, description="문의 제목")
    message: str = Field(..., min_length=1, max_length=2000, description="문의 내용")


class CustomerInquiryResponse(BaseModel):
    """고객 문의 응답 스키마"""
    success: bool = Field(..., description="저장 성공 여부")
    message: str = Field(..., description="응답 메시지")
    inquiry_id: Optional[str] = Field(None, description="노션 페이지 ID")
    timestamp: datetime = Field(..., description="처리 시간")


class NotionErrorResponse(BaseModel):
    """노션 연동 오류 응답"""
    success: bool = Field(False, description="저장 성공 여부")
    error: str = Field(..., description="오류 메시지")
    detail: Optional[str] = Field(None, description="상세 오류 내용")
    timestamp: datetime = Field(..., description="오류 발생 시간")
    
    @staticmethod
    def validate_non_negative(value: float, field_name: str) -> List[ValidationWarning]:
        """음수 금지 검증"""
        warnings = []
        if value < 0:
            warnings.append(ValidationWarning(
                type="error",
                field=field_name, 
                message=f"{field_name}은 음수일 수 없습니다.",
                suggestion="0 이상의 값을 입력하세요."
            ))
        return warnings
    
    @staticmethod
    def validate_positive(value: float, field_name: str) -> List[ValidationWarning]:
        """양수 검증"""
        warnings = []
        if value <= 0:
            warnings.append(ValidationWarning(
                type="error",
                field=field_name,
                message=f"{field_name}은 0보다 커야 합니다.",
                suggestion="0보다 큰 값을 입력하세요."
            ))
        return warnings
