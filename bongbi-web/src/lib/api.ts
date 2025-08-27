// API 기본 설정
const API_BASE_URL = 'http://localhost:8001/api/v1';

// column_master.json 기준 타입 정의
export interface ValidationWarning {
  type: string; // warning, error, info
  field?: string; // 관련 필드명
  message: string; // 경고 메시지
  suggestion?: string; // 개선 제안
}

export interface RodCalculateRequest {
  materialType?: string; // 재질 유형 (rod 또는 sheet)
  productWeight?: number; // 제품 1개의 예상 중량 (g)
  shape: string; // 봉재 형상 종류
  diameter?: number; // 원형/육각형/정사각형의 직경 (mm)
  width?: number; // 직사각형(봉재) 가로 (mm)
  height?: number; // 직사각형(봉재) 세로 (mm)
  productLength: number; // 봉재 가공 시 제품 길이 (mm)
  quantity: number; // 총 제작 수량 (개)
  cuttingLoss: number; // 절단 시 손실되는 길이 (mm)
  headCut: number; // 봉재 선단 가공 손실 (mm)
  tailCut: number; // 봉재 후단 가공 손실 (mm)
  standardBarLength: number; // 표준 봉재 길이 (mm)
  materialDensity: number; // 재질의 밀도 (kg/m³)
  materialPrice: number; // 봉재의 kg당 단가 (₩/kg)
  actualProductWeight?: number; // 사용자가 입력하는 제품 1개 실제 중량 (g)
  recoveryRatio?: number; // 스크랩 환산율 (%)
  scrapUnitPrice?: number; // 스크랩 회수 단가 (₩/kg)
}

export interface PlateCalculateRequest {
  materialType?: string; // 재질 유형 (rod 또는 sheet)
  plateThickness: number; // 판재의 두께 (mm)
  plateWidth: number; // 판재의 폭 (mm)
  plateLength: number; // 판재의 길이 (mm)
  quantity: number; // 총 제작 수량 (개)
  materialDensity: number; // 재질의 밀도 (kg/m³)
  plateUnitPrice: number; // 판재의 kg당 단가 (₩/kg)
}

export interface RodCalculateResponse {
  barsNeeded: number; // 필요한 봉재 수량 (개)
  materialTotalWeight: number; // 필요한 모든 봉재의 총 중량 (kg)
  totalWeight: number; // 전체 제품의 총 중량 (kg)
  totalCost: number; // 전체 생산에 필요한 재료비 (₩)
  unitCost: number; // 제품 1개당 재료 단가 (₩)
  utilizationRate: number; // 자재 사용 효율 (%)
  wastage: number; // 자재 사용 손실률 (%)
  scrapWeight: number; // 제품 생산 후 남은 재활용 가능한 자투리 자재량 (kg)
  scrapSavings: number; // 스크랩 회수로 절약된 금액 (₩)
  realCost: number; // 총 재료비에서 스크랩 절감액을 차감한 실제 재료비 (₩)
  isPlate: boolean; // 판재 여부
  totalActualProductWeight?: number; // 실제 제품 1개 중량 × 수량의 합 (kg)
  warnings: ValidationWarning[]; // 검증 경고 메시지 목록
  suggestions: string[]; // 최적화 제안 목록
}

export interface PlateCalculateResponse {
  totalWeight: number; // 전체 제품의 총 중량 (kg)
  totalCost: number; // 전체 생산에 필요한 재료비 (₩)
  unitCost: number; // 제품 1개당 재료 단가 (₩)
  utilizationRate: number; // 자재 사용 효율 (%)
  wastage: number; // 자재 사용 손실률 (%)
  scrapSavings: number; // 스크랩 회수로 절약된 금액 (₩)
  realCost: number; // 총 재료비에서 스크랩 절감액을 차감한 실제 재료비 (₩)
  isPlate: boolean; // 판재 여부
  totalActualProductWeight?: number; // 실제 제품 1개 중량 × 수량의 합 (kg)
  warnings: ValidationWarning[]; // 검증 경고 메시지 목록
  suggestions: string[]; // 최적화 제안 목록
}

export interface ScrapCalculateRequest {
  totalWeight: number; // 전체 제품의 총 중량 (kg)
  totalCost: number; // 전체 생산에 필요한 재료비 (₩)
  quantity: number; // 총 제작 수량 (개)
  actualProductWeight: number; // 사용자가 입력하는 제품 1개 실제 중량 (g)
  recoveryRatio: number; // 스크랩 환산율 (%)
  scrapUnitPrice: number; // 스크랩 회수 단가 (₩/kg)
  materialTotalWeight?: number; // 봉재 총중량 (kg) - 스크랩 계산용
}

export interface ScrapCalculateResponse {
  scrapWeight: number; // 제품 생산 후 남은 재활용 가능한 자투리 자재량 (kg)
  scrapSavings: number; // 스크랩 회수로 절약된 금액 (₩)
  realCost: number; // 총 재료비에서 스크랩 절감액을 차감한 실제 재료비 (₩)
  unitCost: number; // 제품 1개당 재료 단가 (₩)
  updatedTotalWeight?: number; // 업데이트된 제품 총중량 (kg) - actualProductWeight 입력 시
  totalActualProductWeight?: number; // 실제 제품 1개 중량 × 수량의 합 (kg)
  warnings: ValidationWarning[]; // 검증 경고 메시지 목록
}

class BongbiApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData && (errorData.detail || errorData.message)) || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  // 봉재 계산 API
  async calculateRod(data: RodCalculateRequest): Promise<RodCalculateResponse> {
    return this.request<RodCalculateResponse>('/calculate/rod', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 판재 계산 API
  async calculatePlate(data: PlateCalculateRequest): Promise<PlateCalculateResponse> {
    return this.request<PlateCalculateResponse>('/calculate/plate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 스크랩 계산 API
  async calculateScrap(data: ScrapCalculateRequest): Promise<ScrapCalculateResponse> {
    return this.request<ScrapCalculateResponse>('/calculate/scrap', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 입력값 유효성 검증 API
  async validateInputs(data: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    column_master_version: string;
  }> {
    return this.request('/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // API 상태 확인
  async healthCheck(): Promise<{ status: string; version: string; column_master_compliant: boolean }> {
    return this.request<{ status: string; version: string; column_master_compliant: boolean }>('/health');
  }

  // 루트 엔드포인트 확인
  async getApiInfo(): Promise<{ message: string; version: string; docs: string }> {
    const rootUrl = this.baseURL.replace('/api/v1', '');
    return fetch(rootUrl).then(res => res.json());
  }

  // 노션 고객 문의 API
  async submitCustomerInquiry(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
    inquiry_id?: string;
    timestamp: string;
  }> {
    return this.request('/notion/customer-inquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// 싱글톤 인스턴스
export const bongbiApi = new BongbiApiClient();

// 편의 함수들
export const calculateRodMaterial = (data: RodCalculateRequest) => bongbiApi.calculateRod(data);
export const calculatePlateMaterial = (data: PlateCalculateRequest) => bongbiApi.calculatePlate(data);
export const validateCalculationInputs = (data: any) => bongbiApi.validateInputs(data);
export const checkApiHealth = () => bongbiApi.healthCheck();
export const getApiInfo = () => bongbiApi.getApiInfo();

// 컬럼마스터 v2.1 기준 폼 데이터 변환 유틸리티
export const convertFormToRodRequest = (formData: any): RodCalculateRequest => {
  // 스크랩 관련 값 처리 (컬럼마스터 scrap_condition 기준)
  const recoveryRatio = formData.recoveryRatio && parseFloat(formData.recoveryRatio) > 0 
    ? parseFloat(formData.recoveryRatio) 
    : undefined;
  
  // 컬럼마스터 별칭 지원: scrapPrice → scrapUnitPrice
  const scrapUnitPrice = formData.scrapPrice || formData.scrapUnitPrice;
  const scrapPrice = scrapUnitPrice && parseFloat(scrapUnitPrice) > 0 
    ? parseFloat(scrapUnitPrice) 
    : undefined;

  const request = {
    materialType: formData.materialType || 'rod',
    productWeight: formData.productWeight ? parseFloat(formData.productWeight) : undefined,
    shape: formData.shape,
    diameter: formData.diameter ? parseFloat(formData.diameter) : undefined,
    width: formData.width ? parseFloat(formData.width) : undefined,
    height: formData.height ? parseFloat(formData.height) : undefined,
    productLength: parseFloat(formData.productLength),
    quantity: parseInt(formData.quantity),
    cuttingLoss: parseFloat(formData.cuttingLoss) || 0,
    headCut: parseFloat(formData.headCut) || 0,
    tailCut: parseFloat(formData.tailCut) || 0,
    standardBarLength: parseFloat(formData.standardBarLength),
    // 컬럼마스터 단위 정책: 프론트에서 g/cm³ 입력 → API는 kg/m³ 기대 → ×1000 변환
    materialDensity: parseFloat(formData.materialDensity) * 1000,
    materialPrice: parseFloat(formData.materialPrice),
    actualProductWeight: formData.actualProductWeight ? parseFloat(formData.actualProductWeight) : undefined,
    recoveryRatio: recoveryRatio,
    scrapUnitPrice: scrapPrice,
  };

  // Debug: 스크랩 데이터 변환 로그
  if (request.recoveryRatio && request.recoveryRatio > 0) {
    console.log('API Request - Scrap data conversion (Column Master v2.1):', {
      recoveryRatio: request.recoveryRatio,
      scrapUnitPrice: request.scrapUnitPrice,
      originalData: {
        recoveryRatio: formData.recoveryRatio,
        scrapPrice: formData.scrapUnitPrice || formData.scrapPrice
      }
    });
  }

  return request;
};

export const convertFormToPlateRequest = (formData: any): PlateCalculateRequest => {
  return {
    materialType: formData.materialType || 'sheet',
    plateThickness: parseFloat(formData.plateThickness),
    plateWidth: parseFloat(formData.plateWidth),
    plateLength: parseFloat(formData.plateLength),
    quantity: parseInt(formData.quantity),
    // 컬럼마스터 단위 정책: 프론트에서 g/cm³ 입력 → API는 kg/m³ 기대 → ×1000 변환
    materialDensity: parseFloat(formData.materialDensity) * 1000,
    plateUnitPrice: parseFloat(formData.plateUnitPrice),
  };
};

// 경고 메시지 해석 유틸리티
export const parseValidationWarnings = (warnings: ValidationWarning[]) => {
  const errors = warnings.filter(w => w.type === 'error');
  const warnings_only = warnings.filter(w => w.type === 'warning');
  const infos = warnings.filter(w => w.type === 'info');
  
  return {
    hasErrors: errors.length > 0,
    hasWarnings: warnings_only.length > 0,
    hasInfos: infos.length > 0,
    errors: errors.map(w => w.message),
    warnings: warnings_only.map(w => w.message),
    infos: infos.map(w => w.message),
    suggestions: warnings.filter(w => w.suggestion).map(w => w.suggestion!),
    all: warnings
  };
};

// 계산 결과 해석 유틸리티 (컬럼마스터 기준)
export const interpretCalculationResults = (response: RodCalculateResponse | PlateCalculateResponse) => {
  const warnings = parseValidationWarnings(response.warnings);
  
  return {
    // 기본 결과
    isValid: !warnings.hasErrors,
    needsAttention: warnings.hasWarnings || warnings.hasErrors,
    
    // 경고 정보
    warnings: warnings,
    
    // 최적화 제안
    suggestions: response.suggestions || [],
    
    // 효율성 분석 (컬럼마스터 기준)
    efficiency: {
      utilizationRate: response.utilizationRate,
      grade: getEfficiencyGrade(response.utilizationRate),
      isEfficient: response.utilizationRate >= 80,
      needsImprovement: response.utilizationRate < 60
    },
    
    // 비용 분석
    cost: {
      total: response.totalCost,
      unit: response.unitCost,
      real: response.realCost,
      scrapSavings: response.scrapSavings,
      savingsRatio: response.totalCost > 0 ? (response.scrapSavings / response.totalCost) * 100 : 0
    }
  };
};

// 효율성 등급 판정 (컬럼마스터 기준)
function getEfficiencyGrade(utilizationRate: number): {
  grade: string;
  color: string;
  emoji: string;
  description: string;
} {
  if (utilizationRate >= 90) {
    return {
      grade: '완벽',
      color: 'green',
      emoji: '✅',
      description: '매우 효율적인 사용률입니다'
    };
  } else if (utilizationRate >= 80) {
    return {
      grade: '좋음',
      color: 'blue',
      emoji: '👍',
      description: '좋은 사용률입니다'
    };
  } else if (utilizationRate >= 70) {
    return {
      grade: '양호',
      color: 'yellow',
      emoji: '⚠️',
      description: '개선 여지가 있습니다'
    };
  } else if (utilizationRate >= 60) {
    return {
      grade: '경고',
      color: 'orange',
      emoji: '⚠️',
      description: '비효율적인 사용률입니다'
    };
  } else {
    return {
      grade: '나쁨',
      color: 'red',
      emoji: '🚨',
      description: '심각하게 비효율적입니다'
    };
  }
}

// 컬럼마스터 준수 여부 확인
export const checkColumnMasterCompliance = async (): Promise<boolean> => {
  try {
    const health = await checkApiHealth();
    return health.column_master_compliant === true;
  } catch (error) {
    console.warn('컬럼마스터 준수 여부를 확인할 수 없습니다:', error);
    return false;
  }
};
