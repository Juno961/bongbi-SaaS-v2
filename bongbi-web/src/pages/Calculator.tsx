import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MaterialFormWizard } from "@/components/calculator/MaterialFormWizard";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { SavedOrdersSection } from "@/components/calculator/SavedOrdersSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Save, Download, Share, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OnboardingTour } from "@/components/ui/onboarding-tour";
// API 클라이언트로 대체
import {
  calculateRodMaterial,
  calculatePlateMaterial,
  getApiInfo,
  convertFormToRodRequest,
  convertFormToPlateRequest,
  type RodCalculateResponse,
  type PlateCalculateResponse,
} from "@/lib/api";

interface MaterialFormData {
  productName: string;
  materialType: string;
  shape: string;
  diameter: string;
  width: string;
  height: string;
  productLength: string;
  cuttingLoss: string;
  headCut: string;
  tailCut: string;
  quantity: string;
  customer: string;
  productWeight: string;
  actualProductWeight: string; // 제품 실 중량 (사용자 입력)
  recoveryRatio: string;
  scrapUnitPrice: string;
  standardBarLength: string;
  materialDensity: string;
  materialPrice: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  plateUnitPrice: string;
}

interface CalculationResults {
  totalBarsNeeded: number;
  standardBarLength: number;
  materialCost: number;
  utilizationRate: number;
  scrapSavings: number;
  wastage: number;
  costPerPiece: number;
  materialTotalWeight?: number;
  totalWeight: number;
  realCost?: number;
  scrapWeight?: number;
  warnings?: any[];
  suggestions?: string[];
}

const Calculator = () => {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"rod" | "sheet">("rod");
  const [currentFormData, setCurrentFormData] =
    useState<MaterialFormData | null>(null);
  const savedOrdersRef = useRef<any>(null);
  const productNameUpdateRef = useRef<(() => void) | null>(null);

  // Load calculation settings to determine save behavior
  const [autoCalculateEnabled, setAutoCalculateEnabled] = useState(true);
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(true);
  
  // Onboarding tour state
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // 중복 저장 방지를 위한 state 추가
  const [lastSavedData, setLastSavedData] = useState<string | null>(null);
  const [isRecentlySaved, setIsRecentlySaved] = useState(false);
  const [lastToastTime, setLastToastTime] = useState(0);

  useEffect(() => {
    const loadCalculationSettings = () => {
      const storedSettings = localStorage.getItem("calculationSettings");
      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings);
          setAutoCalculateEnabled(settings.autoCalculate !== false); // 기본값 true
          setSaveHistoryEnabled(settings.saveHistory !== false); // 기본값 true
        } catch (error) {
          console.error("Failed to load calculation settings:", error);
        }
      }
    };

    loadCalculationSettings();

    // Listen for storage changes (when settings are updated in different tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "calculationSettings") {
        loadCalculationSettings();
      }
    };

    // Listen for custom event (when settings are updated in same tab)
    const handleSettingsChange = (e: CustomEvent) => {
      setAutoCalculateEnabled(e.detail.autoCalculate !== false);
      setSaveHistoryEnabled(e.detail.saveHistory !== false);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("calculationSettingsChanged", handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("calculationSettingsChanged", handleSettingsChange as EventListener);
    };
  }, []);

  // API 연결 상태 확인
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        await getApiInfo();
        setApiConnected(true);
        toast.success("백엔드 서버에 성공적으로 연결되었습니다!");
      } catch (error) {
        setApiConnected(false);
        toast.error("백엔드 서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.");
        console.error("API 연결 오류:", error);
      }
    };

    checkApiConnection();
    
    // Check if user should see onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
    const hasUsedCalculator = localStorage.getItem('has-used-calculator');
    if (!hasCompletedOnboarding && !hasUsedCalculator) {
      setShowOnboarding(true);
    }
  }, []);

  // Note: Temporary orders are now managed by SavedOrdersSection with localStorage
  // and will persist during browser session until manually deleted

  // Use dynamic material data from form inputs

  // 데이터 해시 생성 함수 추가
  const generateDataHash = (formData: MaterialFormData, results: CalculationResults) => {
    // 중복 체크를 위한 고유 식별자 생성 (제품명 제외 - 자동 생성되므로)
    const keyData = {
      materialType: formData.materialType || "",
      shape: formData.shape || "",
      diameter: formData.diameter || "",
      width: formData.width || "",
      height: formData.height || "",
      plateThickness: formData.plateThickness || "",
      plateWidth: formData.plateWidth || "",
      plateLength: formData.plateLength || "",
      productLength: formData.productLength || "",
      quantity: formData.quantity || "",
      // 계산 결과의 핵심 값들
      totalCost: Math.round(results.materialCost || 0), // 반올림으로 소수점 오차 방지
      barsNeeded: results.totalBarsNeeded || 0,
      utilizationRate: Math.round((results.utilizationRate || 0) * 100) / 100, // 소수점 2자리로 제한
    };
    
    return JSON.stringify(keyData);
  };

  const calculateMaterials = async (data: MaterialFormData) => {
    // 새로운 계산 시작 시 저장 상태 초기화
    setLastSavedData(null);
    setIsRecentlySaved(false);
    
    setCurrentFormData(data);

    // 기본 유효성 검사
    const isRodValid =
      activeTab === "rod" &&
      data.shape &&
      ((data.shape === "rectangle" && data.width && data.height) ||
        (data.shape !== "rectangle" && data.diameter)) &&
      data.productLength &&
      data.quantity &&
      data.materialType;
    const isSheetValid =
      activeTab === "sheet" &&
      data.plateThickness &&
      data.plateWidth &&
      data.plateLength &&
      data.quantity &&
      data.materialType;

    if (!isRodValid && !isSheetValid) {
      setResults(null);
      return;
    }

    if (apiConnected === false) {
      toast.error("백엔드 서버에 연결되지 않았습니다.");
      return;
    }

    setIsCalculating(true);
    try {
      if (activeTab === "sheet") {
        const plateReq = convertFormToPlateRequest(data);
        const resp: PlateCalculateResponse = await calculatePlateMaterial(plateReq);
        const calculationResults: CalculationResults = {
          totalBarsNeeded: 0,
          standardBarLength: 0,
          materialCost: resp.totalCost,
          utilizationRate: resp.utilizationRate,
          scrapSavings: resp.scrapSavings,
          wastage: resp.wastage,
          costPerPiece: resp.unitCost,
          totalWeight: resp.totalWeight,
          realCost: resp.realCost,
          warnings: resp.warnings,
          suggestions: resp.suggestions,
        };
        setResults(calculationResults);
      } else {
        const rodReq = convertFormToRodRequest(data);
        const resp: RodCalculateResponse = await calculateRodMaterial(rodReq);
        const calculationResults: CalculationResults = {
          totalBarsNeeded: resp.barsNeeded,
          standardBarLength: parseFloat(data.standardBarLength) || 0,
          materialCost: resp.totalCost,
          utilizationRate: resp.utilizationRate,
          scrapSavings: resp.scrapSavings,
          wastage: resp.wastage,
          costPerPiece: resp.unitCost,
          materialTotalWeight: resp.materialTotalWeight,
          totalWeight: resp.totalWeight,
          realCost: resp.realCost,
          scrapWeight: resp.scrapWeight,
          warnings: resp.warnings,
          suggestions: resp.suggestions,
        };
        setResults(calculationResults);
      }
      
      // Toast 중복 방지: 마지막 토스트 후 2초가 지난 경우에만 표시
      const now = Date.now();
      if (now - lastToastTime > 2000) {
        toast.success("계산이 완료되었습니다!");
        setLastToastTime(now);
      }
    } catch (error) {
      console.error("계산 오류:", error);
      toast.error(`계산 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveOrder = (orderData: any) => {
    if (!results || !currentFormData) {
      toast.error("저장할 계산 결과가 없습니다.");
      return;
    }

    // 중복 체크 - 임시 저장용
    const currentDataHash = generateDataHash(currentFormData, results);
    
    if (lastSavedData === currentDataHash) {
      toast.warning("이미 저장된 동일한 계산 결과입니다!", {
        description: "다른 조건으로 계산하거나 값을 변경해주세요."
      });
      return;
    }

    // 최근 저장 체크 (3초 쿨다운)
    if (isRecentlySaved) {
      toast.warning("너무 빠르게 저장하고 있습니다!", {
        description: "잠시 후 다시 시도해주세요."
      });
      return;
    }

    if (savedOrdersRef.current) {
      savedOrdersRef.current(orderData);
      
      // 저장 성공 시 해시 업데이트 및 쿨다운 설정
      setLastSavedData(currentDataHash);
      setIsRecentlySaved(true);
      
      // 3초 후 쿨다운 해제
      setTimeout(() => {
        setIsRecentlySaved(false);
      }, 3000);
      
      toast.success("계산 결과가 임시 저장되었습니다!");
    }
  };

  // Permanent save to OrderHistory (localStorage)
  const handlePermanentSave = () => {
    console.log("🚀 handlePermanentSave 함수 시작");
    console.log("results:", !!results, "currentFormData:", !!currentFormData);
    
    if (!results || !currentFormData) {
      console.log("❌ 저장할 데이터가 없습니다");
      toast.error("저장할 계산 결과가 없습니다.");
      return;
    }

    // 중복 체크 - 해시 기반으로 간단하게
    const currentDataHash = generateDataHash(currentFormData, results);
    const existingOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]");
    
    console.log("🔍 중복 체크 시작");
    console.log("Current hash:", currentDataHash);
    console.log("Existing orders count:", existingOrders.length);
    
    const isDuplicate = existingOrders.some((order: any) => {
      // 기존 주문을 동일한 형식으로 변환하여 해시 생성
      const orderFormData = {
        materialType: order.materialType || "",
        shape: order.shape || "",
        diameter: order.diameter || "",
        width: order.width || "",
        height: order.height || "",
        plateThickness: order.plateThickness || "",
        plateWidth: order.plateWidth || "",
        plateLength: order.plateLength || "",
        productLength: order.productLength || "",
        quantity: order.quantity ? order.quantity.toString() : "",
      } as MaterialFormData;
      
      const orderResults = {
        materialCost: order.totalCost || 0,
        totalBarsNeeded: order.barsNeeded || 0,
        utilizationRate: order.utilizationRate || 0,
      } as CalculationResults;
      
      const existingHash = generateDataHash(orderFormData, orderResults);
      
      console.log("Comparing:", {
        current: currentDataHash,
        existing: existingHash,
        match: currentDataHash === existingHash
      });
      
      return currentDataHash === existingHash;
    });

    if (isDuplicate) {
      toast.warning("이미 영구 저장된 동일한 주문입니다!", {
        description: "주문 내역에서 확인할 수 있습니다."
      });
      return;
    }

    // 최근 저장 체크
    if (isRecentlySaved) {
      toast.warning("너무 빠르게 저장하고 있습니다!", {
        description: "잠시 후 다시 시도해주세요."
      });
      return;
    }

    const newOrder = {
      id: Date.now().toString(),
      productName: currentFormData.productName || "제품-001",
      quantity: parseInt(currentFormData.quantity) || 0,
      barsNeeded: results.totalBarsNeeded,
      materialType: currentFormData.materialType,
      shape: currentFormData.shape || "",
      diameter: currentFormData.diameter || "",
      width: currentFormData.width || "",
      height: currentFormData.height || "",
      plateThickness: currentFormData.plateThickness || "",
      plateWidth: currentFormData.plateWidth || "",
      plateLength: currentFormData.plateLength || "",
      productLength: currentFormData.productLength || "",
      cuttingLoss: currentFormData.cuttingLoss || "",
      headCut: currentFormData.headCut || "",
      tailCut: currentFormData.tailCut || "",
      customer: currentFormData.customer || "",
      productWeight: currentFormData.productWeight || "",
      actualProductWeight: currentFormData.actualProductWeight || "",
      recoveryRatio: currentFormData.recoveryRatio || "",
      scrapUnitPrice: currentFormData.scrapUnitPrice || "",
      scrapPrice: currentFormData.scrapPrice || "",
      standardBarLength: results.standardBarLength,
      materialDensity: currentFormData.materialDensity || "",
      materialPrice: currentFormData.materialPrice || "",
      plateUnitPrice: currentFormData.plateUnitPrice || "",
      totalCost: results.materialCost,
      unitCost: results.costPerPiece,
      utilizationRate: activeTab === "sheet" ? 100 : results.utilizationRate,
      scrapSavings: results.scrapSavings || 0,
      wastage: results.wastage || 0,
      totalWeight: results.totalWeight,
      timestamp: new Date(),
      isPlate: activeTab === "sheet",
    };

    // Save to localStorage for OrderHistory
    const updatedOrders = [newOrder, ...existingOrders];
    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));

    // 저장 성공 시 해시 업데이트 및 쿨다운 설정
    setLastSavedData(currentDataHash);
    setIsRecentlySaved(true);
    
    // 3초 후 쿨다운 해제
    setTimeout(() => {
      setIsRecentlySaved(false);
    }, 3000);

    // Update product name for next calculation after successful save
    if (productNameUpdateRef.current) {
      productNameUpdateRef.current();
    }

    // Show success message or feedback
    toast.success("계산 결과가 주문 내역에 영구 저장되었습니다!", {
      description: "주문 내역 메뉴에서 저장된 결과를 확인할 수 있습니다.",
    });
  };

  // Clear calculation results (for "새로 계산하기" button)
  const handleClearResults = () => {
    setResults(null);
    setCurrentFormData(null);
    setIsCalculating(false);
  };

  // Onboarding tour steps
  const onboardingSteps = [
    {
      id: "welcome",
      title: "봉비서에 오신 것을 환영합니다!",
      position: 'center' as const,
      content: (
        <div className="space-y-3">
          <p>CNC 재료 계산을 빠르고 정확하게 도와드리는 봉비서입니다.</p>
          <p>간단한 가이드를 통해 사용법을 익혀보세요!</p>
        </div>
      ),
    },
    {
      id: "material-tabs",
      title: "재료 유형 선택",
      target: ".material-type-tabs",
      content: (
        <div className="space-y-2">
          <p>먼저 사용할 재료 유형을 선택하세요.</p>
          <ul className="text-sm space-y-1">
            <li>• <strong>봉재/각재</strong>: 원봉, 각봉 등</li>
            <li>• <strong>판재</strong>: 플레이트, 판금 등</li>
          </ul>
        </div>
      ),
    },
    {
      id: "form-steps",
      title: "단계별 입력",
      target: ".form-wizard-progress",
      content: (
        <div className="space-y-2">
          <p>입력 과정이 3단계로 나뉘어져 있어 쉽게 따라할 수 있습니다.</p>
          <ul className="text-sm space-y-1">
            <li>• <strong>1단계</strong>: 기본 정보 (필수)</li>
            <li>• <strong>2단계</strong>: 치수 입력 (필수)</li>
            <li>• <strong>3단계</strong>: 고급 설정 (선택)</li>
          </ul>
        </div>
      ),
    },
    {
      id: "auto-calculate",
      title: "실시간 자동 계산",
      target: ".results-panel",
      content: (
        <div className="space-y-2">
          <p>필수 정보를 입력하면 자동으로 계산됩니다.</p>
          <p className="text-sm text-gray-600">설정에서 수동 계산으로 변경할 수 있습니다.</p>
        </div>
      ),
    },
    {
      id: "save-orders",
      title: "주문 저장",
      target: ".saved-orders-section",
      content: (
        <div className="space-y-2">
          <p>계산 결과를 임시 저장하거나 영구 보관할 수 있습니다.</p>
          <p className="text-sm text-gray-600">저장된 주문은 주문 내역에서 확인 가능합니다.</p>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row lg:h-screen">
        {/* Left Panel - Input Form (4/10 on desktop, full width on mobile) */}
        <div className="w-full lg:w-2/5 bg-[#F7F8FA] lg:border-r border-gray-200 flex flex-col">
          <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
            {/* Material Type Tab Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 material-type-tabs">
              <button
                onClick={() => setActiveTab("rod")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  activeTab === "rod"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                봉재/각재
              </button>
              <button
                onClick={() => setActiveTab("sheet")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  activeTab === "sheet"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                판재
              </button>
            </div>
          </div>

          {/* Input Form - Scrollable */}
          <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6">
            <MaterialFormWizard
              onCalculate={calculateMaterials}
              materialType={activeTab}
              onProductNameUpdate={(updateFn) => {
                productNameUpdateRef.current = updateFn;
              }}
              autoCalculateEnabled={autoCalculateEnabled}
              onClearResults={handleClearResults}
            />
          </div>
        </div>

        {/* Right Panel - Results (6/10 on desktop, full width below input on mobile) */}
        <div className="w-full lg:w-3/5 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 lg:p-6 bg-[#F7F8FA] border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                  계산 결과
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  실시간 자재 계산 및 견적
                </p>
              </div>
              {!saveHistoryEnabled && (
                <div className="hidden sm:flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePermanentSave}
                    disabled={!results}
                    className="text-gray-600 border-gray-300 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    계산결과 저장하기
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Saved Orders Section */}
          <div className="p-4 lg:p-6 border-b border-gray-200 bg-[#F7F8FA] saved-orders-section">
            <SavedOrdersSection
              materialType={activeTab}
              onAddOrder={(addOrderFn) => {
                savedOrdersRef.current = addOrderFn;
              }}
            />
          </div>

          {/* Results Content - Scrollable */}
          <div className="flex-1 lg:overflow-y-auto p-4 lg:p-6 bg-[#F7F8FA] results-panel">
            <ResultsPanel
              results={results}
              isCalculating={isCalculating}
              formData={currentFormData}
              onSaveOrder={handleSaveOrder}
              materialType={activeTab}
              autoSaveEnabled={saveHistoryEnabled} // saveHistoryEnabled가 자동저장 여부를 결정
              saveHistoryEnabled={saveHistoryEnabled}
              onPermanentSave={handlePermanentSave}
              onProductNameUpdate={() => {
                if (productNameUpdateRef.current) {
                  productNameUpdateRef.current();
                }
              }}
              isRecentlySaved={isRecentlySaved}
            />
          </div>
        </div>
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour
        steps={onboardingSteps}
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
          toast.success("가이드가 완료되었습니다! 이제 계산을 시작해보세요.");
        }}
      />
    </DashboardLayout>
  );
};

export default Calculator;
