import { useState, useEffect } from "react";
import { FormWizard, FormSection } from "@/components/ui/form-wizard";
import { WelcomeGuide, GuideStep } from "@/components/ui/onboarding-tour";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Package, 
  Ruler, 
  Settings, 
  Calculator, 
  ChevronDown, 
  HelpCircle,
  Target,
  Zap,
  Info,
  Circle,
  Hexagon,
  Square,
  RectangleHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  materialDefaults,
  getMaterialDefaults,
  getMaterialDisplayName,
} from "@/data/materialDefaults";

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
  actualProductWeight: string;
  recoveryRatio: string;
  scrapUnitPrice: string;
  scrapPrice: string;
  standardBarLength: string;
  materialDensity: string;
  materialPrice: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  plateUnitPrice: string;
}

interface MaterialFormWizardProps {
  onCalculate: (data: MaterialFormData) => void;
  materialType: "rod" | "sheet";
  onProductNameUpdate?: (updateFn: () => void) => void;
  autoCalculateEnabled?: boolean;
  onClearResults?: () => void;
}

export const MaterialFormWizard = ({
  onCalculate,
  materialType,
  onProductNameUpdate,
  autoCalculateEnabled = true,
  onClearResults,
}: MaterialFormWizardProps) => {
  const [formData, setFormData] = useState<MaterialFormData>({
    productName: "",
    materialType: "",
    shape: "",
    diameter: "",
    width: "",
    height: "",
    productLength: "",
    cuttingLoss: "2",
    headCut: "20",
    tailCut: "250",
    quantity: "",
    customer: "",
    productWeight: "",
    actualProductWeight: "",
    recoveryRatio: "100",
    scrapUnitPrice: "읽기 전용",
    scrapPrice: "",
    standardBarLength: "",
    materialDensity: "",
    materialPrice: "",
    plateThickness: "",
    plateWidth: "",
    plateLength: "",
    plateUnitPrice: "",
  });

  const [isScrapCalculationEnabled, setIsScrapCalculationEnabled] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Check if this is user's first visit
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
    const hasUsedCalculator = localStorage.getItem('has-used-calculator');
    
    // Show welcome guide if user hasn't completed onboarding and hasn't used calculator
    if (!hasCompletedOnboarding && !hasUsedCalculator) {
      setIsFirstVisit(true);
    }
  }, []);

  // Auto-generate product name
  const generateProductName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]");
    const counter = (savedOrders.length + 1).toString().padStart(3, "0");
    return `${year}${month}${day}-${counter}`;
  };

  // Initialize form data
  useEffect(() => {
    if (!formData.productName) {
      setFormData((prev) => ({ ...prev, productName: generateProductName() }));
    }

    if (!formData.materialType) {
      const firstMaterialKey = Object.keys(materialDefaults)[0];
      if (firstMaterialKey) {
        const defaults = getMaterialDefaults(firstMaterialKey);
        if (defaults) {
          setFormData((prev) => ({
            ...prev,
            materialType: firstMaterialKey,
            standardBarLength: defaults.standard_bar_length.toString(),
            materialDensity: defaults.material_density.toString(),
            materialPrice: defaults.bar_unit_price.toString(),
            plateUnitPrice: defaults.plate_unit_price.toString(),
            scrapPrice: defaults.scrap_unit_price.toString(),
          }));
        }
      }
    }
  }, []);

  // Load default values from settings
  useEffect(() => {
    const loadDefaultValues = () => {
      const storedDefaults = localStorage.getItem("defaultValues");
      if (storedDefaults) {
        try {
          const defaults = JSON.parse(storedDefaults);
          setFormData(prev => ({
            ...prev,
            headCut: defaults.headCut?.toString() || "20",
            tailCut: defaults.tailCut?.toString() || "250",
            recoveryRatio: defaults.scrapRatio?.toString() || "100",
          }));
        } catch (error) {
          console.error("Failed to load default values:", error);
        }
      }
    };

    loadDefaultValues();

    const handleDefaultValuesChange = (e: CustomEvent) => {
      setFormData(prev => ({
        ...prev,
        headCut: e.detail.headCut?.toString() || "20",
        tailCut: e.detail.tailCut?.toString() || "250",
        // 스크랩이 활성화된 상태에서 기본값 변경 시 즉시 반영
        recoveryRatio: isScrapCalculationEnabled 
          ? e.detail.scrapRatio?.toString() || "80"
          : prev.recoveryRatio,
      }));
    };

    // Handle material defaults changes
    const handleMaterialDefaultsChange = (e: CustomEvent) => {
      // If current material type is affected, update form data
      if (formData.materialType && e.detail[formData.materialType]) {
        const newDefaults = e.detail[formData.materialType];
        setFormData(prev => ({
          ...prev,
          standardBarLength: newDefaults.standard_bar_length?.toString() || prev.standardBarLength,
          materialDensity: newDefaults.material_density?.toString() || prev.materialDensity,
          materialPrice: newDefaults.bar_unit_price?.toString() || prev.materialPrice,
          plateUnitPrice: newDefaults.plate_unit_price?.toString() || prev.plateUnitPrice,
          scrapPrice: newDefaults.scrap_unit_price?.toString() || prev.scrapPrice,
        }));
        
        // 실시간 재계산 트리거 강화
        if (autoCalculateEnabled) {
          const isBasicDataComplete = materialType === "rod" 
            ? formData.materialType && formData.shape && 
              ((formData.shape === "rectangle" && formData.width && formData.height) || 
               (formData.shape !== "rectangle" && formData.diameter)) &&
              formData.productLength && formData.quantity
            : formData.materialType && formData.plateThickness && 
              formData.plateWidth && formData.plateLength && formData.quantity;

          if (isBasicDataComplete) {
            const calculationData = {
              ...formData,
              ...newDefaults, // 새로운 기본값들 적용
              scrapUnitPrice: newDefaults.scrap_unit_price?.toString() || formData.scrapPrice,
              recoveryRatio: isScrapCalculationEnabled && formData.recoveryRatio ? formData.recoveryRatio : undefined,
              actualProductWeight: isScrapCalculationEnabled && formData.actualProductWeight ? formData.actualProductWeight : undefined,
            };
            setTimeout(() => onCalculate(calculationData), 150); // 딜레이 약간 증가
          }
        }
      }
    };

    window.addEventListener("defaultValuesChanged", handleDefaultValuesChange as EventListener);
    window.addEventListener("materialDefaultsChanged", handleMaterialDefaultsChange as EventListener);
    
    return () => {
      window.removeEventListener("defaultValuesChanged", handleDefaultValuesChange as EventListener);
      window.removeEventListener("materialDefaultsChanged", handleMaterialDefaultsChange as EventListener);
    };
  }, [formData.materialType]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId?: string) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        nextField.focus();
      }
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof MaterialFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate if enabled and basic required fields are filled
      if (autoCalculateEnabled) {
        const isBasicDataComplete = materialType === "rod" 
          ? newData.materialType && newData.shape && 
            ((newData.shape === "rectangle" && newData.width && newData.height) || 
             (newData.shape !== "rectangle" && newData.diameter)) &&
            newData.productLength && newData.quantity
          : newData.materialType && newData.plateThickness && 
            newData.plateWidth && newData.plateLength && newData.quantity;

        if (isBasicDataComplete) {
          const calculationData = {
            ...newData,
            scrapUnitPrice: newData.scrapPrice,
            // Include actual recovery ratio when scrap is enabled, undefined when disabled
            recoveryRatio: isScrapCalculationEnabled && newData.recoveryRatio ? newData.recoveryRatio : undefined,
            actualProductWeight: isScrapCalculationEnabled && newData.actualProductWeight ? newData.actualProductWeight : undefined,
          };
          // Debug: log calculation data for scrap debugging
          if (isScrapCalculationEnabled) {
            console.log('Scrap calculation enabled - sending data:', {
              recoveryRatio: calculationData.recoveryRatio,
              scrapUnitPrice: calculationData.scrapUnitPrice,
              actualProductWeight: calculationData.actualProductWeight,
              isScrapEnabled: isScrapCalculationEnabled,
              allFormData: newData
            });
          }
          setTimeout(() => onCalculate(calculationData), 100);
        }
      }
      
      return newData;
    });
  };

  // Handle material type change
  const handleMaterialChange = (value: string) => {
    const defaults = getMaterialDefaults(value);
    if (defaults) {
      setFormData(prev => ({
        ...prev,
        materialType: value,
        standardBarLength: defaults.standard_bar_length.toString(),
        materialDensity: defaults.material_density.toString(),
        materialPrice: defaults.bar_unit_price.toString(),
        plateUnitPrice: defaults.plate_unit_price.toString(),
        scrapPrice: defaults.scrap_unit_price.toString(),
        // 스크랩 환산비율은 설정메뉴 기본값 사용
        recoveryRatio: prev.recoveryRatio || "80",
      }));
    }
  };

  // Manual calculate function
  const handleManualCalculate = () => {
    const calculationData = {
      ...formData,
      scrapUnitPrice: formData.scrapPrice,
      // Include actual recovery ratio when scrap is enabled, undefined when disabled
      recoveryRatio: isScrapCalculationEnabled && formData.recoveryRatio ? formData.recoveryRatio : undefined,
      actualProductWeight: isScrapCalculationEnabled && formData.actualProductWeight ? formData.actualProductWeight : undefined,
    };
    // Debug: log manual calculation data for scrap debugging
    if (isScrapCalculationEnabled) {
      console.log('Manual scrap calculation - sending data:', {
        recoveryRatio: calculationData.recoveryRatio,
        scrapUnitPrice: calculationData.scrapUnitPrice,
        actualProductWeight: calculationData.actualProductWeight,
        isScrapEnabled: isScrapCalculationEnabled,
        allFormData: formData
      });
    }
    onCalculate(calculationData);
    localStorage.setItem('has-used-calculator', 'true');
  };

  // Reset form to initial state
  const handleFormReset = () => {
    const newProductName = generateProductName();
    setFormData({
      productName: newProductName,
      materialType: formData.materialType, // Keep current material
      shape: "",
      diameter: "",
      width: "",
      height: "",
      productLength: "",
      cuttingLoss: "2",
      headCut: formData.headCut, // Keep current settings
      tailCut: formData.tailCut, // Keep current settings
      quantity: "",
      customer: "",
      productWeight: "",
      actualProductWeight: "",
      recoveryRatio: "100",
      scrapUnitPrice: "읽기 전용",
      scrapPrice: formData.scrapPrice, // Keep current scrap price
      standardBarLength: formData.standardBarLength, // Keep material defaults
      materialDensity: formData.materialDensity,
      materialPrice: formData.materialPrice,
      plateThickness: "",
      plateWidth: "",
      plateLength: "",
      plateUnitPrice: formData.plateUnitPrice,
    });
    
    // Reset scrap calculation state
    setIsScrapCalculationEnabled(false);
    
    // Clear calculation results in parent component
    if (onClearResults) {
      onClearResults();
    }
  };

  // Validation functions
  const isStep1Valid = () => {
    return formData.materialType && formData.productName;
  };

  const isStep2Valid = () => {
    if (materialType === "rod") {
      return formData.shape && 
        ((formData.shape === "rectangle" && formData.width && formData.height) ||
         (formData.shape !== "rectangle" && formData.diameter)) &&
        formData.productLength && formData.quantity;
    } else {
      return formData.plateThickness && formData.plateWidth && 
             formData.plateLength && formData.quantity;
    }
  };

  // Show welcome guide for first-time users
  if (isFirstVisit) {
    return (
      <div className="space-y-6">
        <WelcomeGuide
          title="봉비서에 오신 것을 환영합니다!"
          description="CNC 재료 계산을 빠르고 정확하게 도와드립니다. 간단한 3단계로 시작해보세요."
        >
          <GuideStep
            number={1}
            title="재료 선택"
            description="사용할 재료와 제품명을 입력하세요"
          />
          <GuideStep
            number={2}
            title="치수 입력"
            description="제품의 크기와 수량을 정확히 입력하세요"
          />
          <GuideStep
            number={3}
            title="계산 실행"
            description="자동 계산되거나 버튼을 눌러 결과를 확인하세요"
          />
          <Button 
            onClick={() => {
              setIsFirstVisit(false);
              localStorage.setItem('has-used-calculator', 'true');
            }}
            className="w-full mt-4"
          >
            시작하기
          </Button>
        </WelcomeGuide>
      </div>
    );
  }

  const steps = [
    {
      id: "basic",
      title: "기본 정보",
      description: "제품명과 재료를 선택하세요",
      isValid: isStep1Valid(),
      content: (
        <FormSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-sm font-medium">
                제품명 <span className="text-red-500">*</span>
              </Label>
                                    <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => handleInputChange("productName", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "material-select")}
                        placeholder="예: 20241201-001"
                        className="input-modern"
                      />
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                재료 선택 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.materialType}
                onValueChange={handleMaterialChange}
              >
                <SelectTrigger id="material-select" className="w-full">
                  <SelectValue placeholder="재료를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(materialDefaults).map(([key, data]) => (
                    <SelectItem key={key} value={key}>
                      {getMaterialDisplayName(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Material Info Card */}
          {formData.materialType && (
            <Card className="mt-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">재료 정보</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">밀도:</span>
                    <span className="ml-1 font-medium">{formData.materialDensity} g/cm³</span>
                  </div>
                  <div>
                    <span className="text-gray-600">봉재 단가:</span>
                    <span className="ml-1 font-medium">{parseInt(formData.materialPrice).toLocaleString()} ₩/kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">표준 길이:</span>
                    <span className="ml-1 font-medium">{formData.standardBarLength} mm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">스크랩 단가:</span>
                    <span className="ml-1 font-medium">{parseInt(formData.scrapPrice).toLocaleString()} ₩/kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </FormSection>
      ),
    },
    {
      id: "dimensions",
      title: "치수 입력",
      description: materialType === "rod" ? "봉재/각재의 크기와 수량을 입력하세요" : "판재의 크기와 수량을 입력하세요",
      isValid: isStep2Valid(),
      content: (
        <FormSection>
          {materialType === "rod" ? (
            <>
              {/* Shape Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  형태 <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "circle", label: "원봉", icon: Circle },
                    { value: "hexagon", label: "육각봉", icon: Hexagon },
                    { value: "square", label: "정사각봉", icon: Square },
                    { value: "rectangle", label: "직사각봉", icon: RectangleHorizontal },
                  ].map((shape) => {
                    const IconComponent = shape.icon;
                    return (
                      <Button
                        key={shape.value}
                        variant={formData.shape === shape.value ? "default" : "outline"}
                        onClick={() => handleInputChange("shape", shape.value)}
                        className="h-12 flex flex-col gap-1"
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-xs">{shape.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.shape === "rectangle" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="width" className="text-sm font-medium">
                        가로 (mm) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.width}
                        onChange={(e) => handleInputChange("width", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "height")}
                        placeholder="10"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm font-medium">
                        세로 (mm) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "productLength")}
                        placeholder="20"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="diameter" className="text-sm font-medium">
                      지름 (mm) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="diameter"
                      type="number"
                      value={formData.diameter}
                      onChange={(e) => handleInputChange("diameter", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "productLength")}
                      placeholder="10"
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="productLength" className="text-sm font-medium">
                    제품 길이 (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productLength"
                    type="number"
                    value={formData.productLength}
                    onChange={(e) => handleInputChange("productLength", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "quantity")}
                    placeholder="100"
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>
            </>
          ) : (
            // Plate dimensions
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateThickness" className="text-sm font-medium">
                  두께 (mm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="plateThickness"
                  type="number"
                  value={formData.plateThickness}
                  onChange={(e) => handleInputChange("plateThickness", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "plateWidth")}
                  placeholder="10"
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateWidth" className="text-sm font-medium">
                  가로 (mm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="plateWidth"
                  type="number"
                  value={formData.plateWidth}
                  onChange={(e) => handleInputChange("plateWidth", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "plateLength")}
                  placeholder="100"
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateLength" className="text-sm font-medium">
                  세로 (mm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="plateLength"
                  type="number"
                  value={formData.plateLength}
                  onChange={(e) => handleInputChange("plateLength", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "quantity")}
                  placeholder="200"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                수량 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "customer")}
                placeholder="10"
                min="1"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-sm font-medium">
                고객명 (선택)
              </Label>
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
                placeholder="고객명 또는 프로젝트명"
              />
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "advanced",
      title: "고급 설정",
      description: "로스 설정과 스크랩 계산을 조정하세요 (선택사항)",
      isOptional: true,
      content: (
        <FormSection>
          {/* Loss Settings */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">로스 설정</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headCut" className="text-sm font-medium">
                    선두 로스 (mm)
                  </Label>
                  <Input
                    id="headCut"
                    type="number"
                    value={formData.headCut}
                    onChange={(e) => handleInputChange("headCut", e.target.value)}
                    placeholder="20"
                    min="0"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tailCut" className="text-sm font-medium">
                    후미 로스 (mm)
                  </Label>
                  <Input
                    id="tailCut"
                    type="number"
                    value={formData.tailCut}
                    onChange={(e) => handleInputChange("tailCut", e.target.value)}
                    placeholder="250"
                    min="0"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuttingLoss" className="text-sm font-medium">
                    절단 로스 (mm)
                  </Label>
                  <Input
                    id="cuttingLoss"
                    type="number"
                    value={formData.cuttingLoss}
                    onChange={(e) => handleInputChange("cuttingLoss", e.target.value)}
                    placeholder="2"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Scrap Calculation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">스크랩 계산</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>스크랩 판매로 인한 비용 절감을 계산합니다</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={isScrapCalculationEnabled}
                onCheckedChange={(checked) => {
                  setIsScrapCalculationEnabled(checked);
                  if (!checked) {
                    // Reset scrap calculation values when disabled
                    handleInputChange("recoveryRatio", "");
                    handleInputChange("actualProductWeight", "");
                  } else {
                    // 설정메뉴의 스크랩 기본값 가져오기
                    const storedDefaults = localStorage.getItem("defaultValues");
                    if (storedDefaults) {
                      try {
                        const defaults = JSON.parse(storedDefaults);
                        handleInputChange("recoveryRatio", defaults.scrapRatio?.toString() || "80");
                      } catch (error) {
                        console.error("Failed to load scrap default:", error);
                        handleInputChange("recoveryRatio", "80"); // 폴백값
                      }
                    } else {
                      handleInputChange("recoveryRatio", "80"); // 폴백값
                    }
                  }
                }}
              />
            </div>

            {isScrapCalculationEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-green-50">
                <div className="space-y-2">
                  <Label htmlFor="actualProductWeight" className="text-sm font-medium">
                    실제 제품 중량 (g) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="actualProductWeight"
                    type="number"
                    value={formData.actualProductWeight}
                    onChange={(e) => handleInputChange("actualProductWeight", e.target.value)}
                    placeholder="100"
                    min="0.1"
                    step="0.1"
                    className="border-green-300 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-600">가공 후 실제 제품 1개의 중량을 입력하세요</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recoveryRatio" className="text-sm font-medium">
                    스크랩 환산 비율 (%)
                  </Label>
                  <Input
                    id="recoveryRatio"
                    type="number"
                    value={formData.recoveryRatio}
                    onChange={(e) => handleInputChange("recoveryRatio", e.target.value)}
                    placeholder="100"
                    min="0"
                    max="100"
                    step="1"
                    className="border-green-300 focus:border-green-500"
                  />

                </div>
                <div className="col-span-full">
                  <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800 font-medium">
                        스크랩 계산 활성화됨
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      스크랩 단가: {parseInt(formData.scrapPrice || '0').toLocaleString()} ₩/kg
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Calculate Button (only shown when auto-calculate is disabled) */}
          {!autoCalculateEnabled && (
            <div className="flex justify-center pt-4">
              <Button onClick={handleManualCalculate} size="lg" className="w-full md:w-auto">
                <Calculator className="w-4 h-4 mr-2" />
                계산하기
              </Button>
            </div>
          )}
        </FormSection>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FormWizard
        steps={steps}
        autoAdvance={autoCalculateEnabled}
        onComplete={() => {
          if (!autoCalculateEnabled) {
            handleManualCalculate();
          }
        }}
        onReset={handleFormReset}
      />
    </div>
  );
};
