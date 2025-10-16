import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, ChevronDown, LogIn, Info, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  materialDefaults,
  getMaterialDefaults,
  getMaterialDisplayName,
  getAllMaterials,
  getMaterialKeys,
} from "@/data/materialDefaults";

import { MaterialFormData } from "@/types/MaterialForm";

interface MaterialFormProps {
  onCalculate: (data: MaterialFormData) => void;
  materialType: "rod" | "sheet";
  onProductNameUpdate?: (updateFn: () => void) => void;
  autoCalculateEnabled?: boolean;
}

export const MaterialForm = ({
  onCalculate,
  materialType,
  onProductNameUpdate,
  autoCalculateEnabled = true,
}: MaterialFormProps) => {
  const [formData, setFormData] = useState<MaterialFormData>({
    productName: "",
    materialType: "",
    shape: "",
    diameter: "",
    width: "",
    height: "",
    productLength: "",
    cuttingLoss: "2",
    headCut: "20", // 기본값이지만 설정에서 변경 가능
    tailCut: "250", // 기본값이지만 설정에서 변경 가능
    quantity: "",
    customer: "",
    productWeight: "",
    actualProductWeight: "",
    recoveryRatio: "", // 기본값이지만 설정에서 변경 가능
    scrapUnitPrice: "읽기 전용",
    standardBarLength: "",
    materialDensity: "",
    materialPrice: "",
    plateThickness: "",
    plateWidth: "",
    plateLength: "",
    plateUnitPrice: "",
  });

  const [isCustomRecoveryRatio, setIsCustomRecoveryRatio] = useState(false);
  const [isScrapCalculationEnabled, setIsScrapCalculationEnabled] = useState(false);

  const [showCommonLoss, setShowCommonLoss] = useState(false);
  const [isScrapOpen, setIsScrapOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);
  const [isProductNameFocused, setIsProductNameFocused] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<Record<string, any>>(getAllMaterials());

  // 수동 계산 함수
  const handleManualCalculate = () => {
    const calculationData = {
      ...formData,
      scrapUnitPrice: formData.scrapUnitPrice, // Use scrapUnitPrice directly
    };
    onCalculate(calculationData);
  };

  // 기본값 설정 연동
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
            recoveryRatio: defaults.scrapRatio?.toString() || "",
          }));
        } catch (error) {
          console.error("Failed to load default values:", error);
        }
      }
    };

    loadDefaultValues();

    // Listen for default values changes
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

    window.addEventListener("defaultValuesChanged", handleDefaultValuesChange as EventListener);

    return () => {
      window.removeEventListener("defaultValuesChanged", handleDefaultValuesChange as EventListener);
    };
  }, []);

  // 커스텀 재료 기본값 불러오기
  const getCustomMaterialDefaults = (materialKey: string) => {
    const storedMaterials = localStorage.getItem("customMaterialDefaults");
    if (storedMaterials) {
      try {
        const customDefaults = JSON.parse(storedMaterials);
        return customDefaults[materialKey] || getMaterialDefaults(materialKey);
      } catch (error) {
        console.error("Failed to load custom material defaults:", error);
      }
    }
    return getMaterialDefaults(materialKey);
  };

  // 소재 기본값 설정 변경 감지
  useEffect(() => {
    const handleMaterialDefaultsChange = (e: CustomEvent) => {
      // Update available materials list
      setAvailableMaterials(getAllMaterials());
      
      // 현재 선택된 재료가 변경된 경우 업데이트
      if (formData.materialType && e.detail[formData.materialType]) {
        const newDefaults = e.detail[formData.materialType];
        setFormData(prev => ({
          ...prev,
          standardBarLength: newDefaults.standard_bar_length.toString(),
          materialDensity: newDefaults.material_density.toString(),
          materialPrice: newDefaults.bar_unit_price.toString(),
          plateUnitPrice: newDefaults.plate_unit_price.toString(),
          scrapUnitPrice: newDefaults.scrap_unit_price.toString(),
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
              standardBarLength: newDefaults.standard_bar_length.toString(),
              materialDensity: newDefaults.material_density.toString(),
              materialPrice: newDefaults.bar_unit_price.toString(),
              plateUnitPrice: newDefaults.plate_unit_price.toString(),
              scrapUnitPrice: newDefaults.scrap_unit_price.toString(),
              recoveryRatio: isScrapCalculationEnabled && formData.recoveryRatio ? formData.recoveryRatio : undefined,
              actualProductWeight: isScrapCalculationEnabled && formData.actualProductWeight ? formData.actualProductWeight : undefined,
            };
            setTimeout(() => onCalculate(calculationData), 150); // 딜레이 약간 증가
          }
        }
      }
    };

    window.addEventListener("materialDefaultsChanged", handleMaterialDefaultsChange as EventListener);

    return () => {
      window.removeEventListener("materialDefaultsChanged", handleMaterialDefaultsChange as EventListener);
    };
  }, [formData.materialType, autoCalculateEnabled, isScrapCalculationEnabled, materialType]);

  // Generate auto product name based on permanently saved orders count
  const generateProductName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    // Get next counter based on today's orders only
    const datePrefix = `${year}${month}${day}`;
    const savedOrders = JSON.parse(localStorage.getItem("savedOrders") || "[]");
    const todayOrders = savedOrders.filter((order: any) => 
      order.productName?.startsWith(datePrefix)
    );
    const counter = (todayOrders.length + 1).toString().padStart(3, "0");

    return `${year}${month}${day}-${counter}`;
  };

  // Function to update product name after permanent save
  const updateProductNameAfterSave = () => {
    const newProductName = generateProductName();
    setFormData((prev) => ({ ...prev, productName: newProductName }));
  };

  // Expose the update function to parent component
  useEffect(() => {
    if (onProductNameUpdate) {
      onProductNameUpdate(updateProductNameAfterSave);
    }
  }, [onProductNameUpdate]);

  // Auto-generate product name if empty and initialize default material
  useEffect(() => {
    if (!formData.productName) {
      setFormData((prev) => ({ ...prev, productName: generateProductName() }));
    }

    // Initialize with first available material defaults if no material is selected
    if (!formData.materialType) {
      const firstMaterialKey = Object.keys(availableMaterials)[0];
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
            scrapUnitPrice: defaults.scrap_unit_price.toString(),
          }));
        }
      }
    }
  }, []);

  const getCurrentMaterialInfo = () => {
    if (!formData.materialType) return null;
    const defaults = getMaterialDefaults(formData.materialType);
    return defaults
      ? {
          density: `${defaults.material_density} g/cm³`,
          barPrice: `${defaults.bar_unit_price.toLocaleString()} ₩/kg`,
          platePrice: `${defaults.plate_unit_price.toLocaleString()} ₩/kg`,
          barLength: `${defaults.standard_bar_length} mm`,
        }
      : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleReset();
  };

  const handleReset = () => {
    const resetData = {
      productName: generateProductName(), // Use the new generation method
      materialType: formData.materialType, // Preserve material
      shape: formData.shape, // Preserve shape
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
      recoveryRatio: formData.recoveryRatio, // Preserve recovery ratio
      scrapUnitPrice: formData.scrapUnitPrice, // Preserve current scrap price
      standardBarLength: formData.standardBarLength, // Preserve material defaults
      materialDensity: formData.materialDensity, // Preserve material defaults
      materialPrice: formData.materialPrice, // Preserve material defaults
      plateThickness: "",
      plateWidth: "",
      plateLength: "",
      plateUnitPrice: formData.plateUnitPrice, // Preserve plate price
    };
    setFormData(resetData);
    setShowCommonLoss(false);
    setIsScrapOpen(false);

    // 실시간 자동 계산이 활성화된 경우에만 자동 계산 실행
    if (autoCalculateEnabled) {
      const calculationData = {
        ...resetData,
        scrapUnitPrice: resetData.scrapUnitPrice, // Use scrapUnitPrice directly
      };
      onCalculate(calculationData);
    }
  };

  const handleInputChange = (field: keyof MaterialFormData, value: string) => {
    let newValue = value;

    // Validate numeric fields for negative values
    const numericFields = [
      'diameter', 'width', 'height', 'productLength', 'quantity',
      'actualProductWeight', 'cuttingLoss', 'headCut', 'tailCut',
      'plateThickness', 'plateWidth', 'plateLength', 'materialDensity',
      'materialPrice', 'plateUnitPrice', 'scrapUnitPrice', 'recoveryRatio'
    ];

    if (numericFields.includes(field) && value !== "") {
      const fieldLabels: Record<string, string> = {
        diameter: "직경",
        width: "가로",
        height: "세로",
        productLength: "제품 길이",
        quantity: "수량",
        actualProductWeight: "제품 실 중량",
        cuttingLoss: "절삭 손실",
        headCut: "헤드 절삭",
        tailCut: "테일 절삭",
        plateThickness: "두께",
        plateWidth: "폭",
        plateLength: "길이",
        materialDensity: "재질 밀도",
        materialPrice: "봉재 단가",
        plateUnitPrice: "판재 단가",
        scrapUnitPrice: "스크랩 단가",
        recoveryRatio: "환산 비율"
      };
      newValue = validateNumericInput(value, fieldLabels[field] || field);
    }

    let updatedData = { ...formData, [field]: newValue };

    // Only auto-generate product name when not focused (to prevent typing interference)
    if (field === "productName" && value === "" && !isProductNameFocused) {
      newValue = generateProductName();
      updatedData[field] = newValue;
    }

    // Auto-populate material defaults when material type is selected
    if (field === "materialType" && value) {
      const defaults = getCustomMaterialDefaults(value);
      if (defaults) {
        updatedData = {
          ...updatedData,
          standardBarLength: defaults.standard_bar_length.toString(),
          materialDensity: defaults.material_density.toString(),
          materialPrice: defaults.bar_unit_price.toString(),
          plateUnitPrice: defaults.plate_unit_price.toString(),
          scrapUnitPrice: defaults.scrap_unit_price.toString(), // Set default scrap price
        };
      }
    }

    setFormData(updatedData);

    // Validate required fields and show gentle feedback
    const validationErrors = validateRequiredFields(updatedData);

    // 실시간 자동 계산이 활성화된 경우에만 자동 계산 실행
    if (autoCalculateEnabled) {
      const calculationData = {
        ...updatedData,
        scrapUnitPrice: updatedData.scrapUnitPrice, // Use scrapUnitPrice directly
      };
      onCalculate(calculationData);
    }

    // Show validation feedback only if there are errors and user has started filling required fields
    if (validationErrors.length > 0 && (updatedData.materialType || updatedData.quantity || updatedData.shape)) {
      // Visual feedback through border color will be handled by CSS classes
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId?: string) => {
    if (e.key === "Enter" && nextFieldId) {
      e.preventDefault();
      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        nextField.focus();
      }
    }
  };

  const handleLoginRequiredClick = () => {
    setIsLoginDialogOpen(true);
  };

  // Validation helper for numeric inputs
  const validateNumericInput = (value: string, fieldName: string): string => {
    const numValue = parseFloat(value);
    if (numValue < 0) {
      toast.error(`${fieldName}은(는) 음수가 될 수 없습니다.`, {
        duration: 2000,
      });
      return "0";
    }
    return value;
  };

  // Validation for required fields based on material type
  const validateRequiredFields = (data: MaterialFormData): string[] => {
    const errors: string[] = [];

    if (!data.materialType) errors.push("재질");
    if (!data.quantity) errors.push("수량");

    if (materialType === "rod") {
      if (!data.shape) errors.push("봉재 형태");
      if (!data.productLength) errors.push("제품 길이");

      if (data.shape === "rectangle") {
        if (!data.width) errors.push("가로");
        if (!data.height) errors.push("세로");
      } else if (data.shape && data.shape !== "rectangle") {
        if (!data.diameter) errors.push("직경");
      }
    } else if (materialType === "sheet") {
      if (!data.plateThickness) errors.push("두께");
      if (!data.plateWidth) errors.push("폭");
      if (!data.plateLength) errors.push("길이");
    }

    return errors;
  };

  // Load scrap calculation default values from settings
  const loadScrapDefaults = () => {
    // Load scrap ratio from settings
    let defaultScrapRatio = "100"; // fallback default
    const storedDefaults = localStorage.getItem("defaultValues");
    if (storedDefaults) {
      try {
        const defaults = JSON.parse(storedDefaults);
        if (defaults.scrapRatio) {
          defaultScrapRatio = defaults.scrapRatio.toString();
        }
      } catch (error) {
        console.error("Failed to load default values:", error);
      }
    }

    // Load scrap unit price from current material defaults
    let defaultScrapPrice = "";
    if (formData.materialType) {
      const defaults = getMaterialDefaults(formData.materialType);
      if (defaults) {
        defaultScrapPrice = defaults.scrap_unit_price.toString();
      }
    }

    // Update form data with defaults
    setFormData(prev => ({
      ...prev,
      recoveryRatio: defaultScrapRatio,
      scrapUnitPrice: defaultScrapPrice
    }));

    // Reset custom recovery ratio state
    setIsCustomRecoveryRatio(false);
  };

  const handleScrapCalculationToggle = (enabled: boolean) => {
    setIsScrapCalculationEnabled(enabled);
    setIsScrapOpen(enabled);

    if (enabled) {
      // Load default values when enabling scrap calculation
      loadScrapDefaults();
    } else {
      // Clear scrap calculation values when disabling
      setFormData(prev => ({
        ...prev,
        actualProductWeight: "",
        recoveryRatio: "",
        scrapUnitPrice: formData.materialType ? getMaterialDefaults(formData.materialType)?.scrap_unit_price.toString() || "" : ""
      }));
      setIsCustomRecoveryRatio(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Basic Information Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <Collapsible open={isBasicInfoOpen} onOpenChange={setIsBasicInfoOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 pl-5">
                    기본 정보
                  </span>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${isBasicInfoOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3 space-y-3">
              {/* Product Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="productName"
                  className="text-sm font-medium text-gray-700"
                >
                  고객사{" "}
                  <span className="text-xs text-gray-500">(선택사항)</span>
                </Label>
                <Input
                  id="productName"
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    handleInputChange("productName", e.target.value)
                  }
                  onFocus={(e) => {
                    setIsProductNameFocused(true);
                    // Select all text on focus for easy replacement
                    e.target.select();
                  }}
                  onBlur={(e) => {
                    setIsProductNameFocused(false);
                    // Auto-fill with today's date if field is empty after losing focus
                    if (e.target.value.trim() === "") {
                      const generatedName = generateProductName();
                      setFormData((prev) => ({
                        ...prev,
                        productName: generatedName,
                      }));
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, "customer")}
                  placeholder="제품명을 입력하세요"
                  className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 placeholder:text-gray-400"
                />
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <Label
                  htmlFor="customer"
                  className="text-sm font-medium text-gray-700"
                >
                  고객사{" "}
                  <span className="text-xs text-gray-500">(선택사항)</span>
                </Label>
                <Input
                  id="customer"
                  type="text"
                  value={formData.customer}
                  onChange={(e) =>
                    handleInputChange("customer", e.target.value)
                  }
                  onClick={handleLoginRequiredClick}
                  onKeyDown={(e) => handleKeyDown(e, "materialType")}
                  className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                  placeholder="고객사를 입력하세요"
                />
                {formData.customer && (
                  <div className="bg-[#3182F6]/10 border border-[#3182F6]/20 rounded-md p-2">
                    <p className="text-sm text-[#3182F6] font-medium">
                      고객사: {formData.customer}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Production Information Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#3182F6] rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">생산 정보</h3>
          </div>

          <div className="space-y-3">
            {/* Material Type */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label
                htmlFor="materialType"
                className="text-sm font-medium text-gray-700 col-span-1"
              >
                재질 <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Select
                  value={formData.materialType}
                  onValueChange={(value) =>
                    handleInputChange("materialType", value)
                  }
                >
                  <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-[#3182F6]">
                    <SelectValue placeholder="재질을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluminum">AL</SelectItem>
                    <SelectItem value="steel">SUM24L/S45C</SelectItem>
                    <SelectItem value="stainless">SUS304</SelectItem>
                    <SelectItem value="stainless_303">SUS303</SelectItem>
                    <SelectItem value="stainless_316">SUS316</SelectItem>
                    <SelectItem value="brass">황동</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rod-specific fields */}
            {materialType === "rod" && (
              <>
                {/* Shape */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label
                    htmlFor="shape"
                    className="text-sm font-medium text-gray-700 col-span-1"
                  >
                    봉재 형태 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.shape}
                    onValueChange={(value) => {
                      handleInputChange("shape", value);
                      // Clear dimension fields when shape changes
                      setFormData((prev) => ({
                        ...prev,
                        diameter: "",
                        width: "",
                        height: "",
                      }));
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-[#3182F6] col-span-3">
                      <SelectValue placeholder="형태를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">원봉</SelectItem>
                      <SelectItem value="hexagon">육각봉</SelectItem>
                      <SelectItem value="square">정사각봉</SelectItem>
                      <SelectItem value="rectangle">직사각봉</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional dimension fields */}
                {(formData.shape === "circle" ||
                  formData.shape === "hexagon" ||
                  formData.shape === "square") && (
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <Label
                      htmlFor="diameter"
                      className="text-sm font-medium text-gray-700 col-span-1"
                    >
                      직경 <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative col-span-3">
                        <Input
                          id="diameter"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.diameter}
                          onChange={(e) =>
                            handleInputChange("diameter", e.target.value)
                          }
                          onKeyDown={(e) => {
                            handleKeyDown(e, "productLength");
                            if (e.key === "-") e.preventDefault();
                          }}
                          className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                        />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        mm
                      </span>
                    </div>
                  </div>
                )}

                {formData.shape === "rectangle" && (
                  <>
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <Label
                        htmlFor="width"
                        className="text-sm font-medium text-gray-700 col-span-1"
                      >
                        가로 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative col-span-3">
                        <Input
                          id="width"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.width}
                          onChange={(e) =>
                            handleInputChange("width", e.target.value)
                          }
                          onKeyDown={(e) => {
                            handleKeyDown(e, "height");
                            if (e.key === "-") e.preventDefault();
                          }}
                          className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          mm
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <Label
                        htmlFor="height"
                        className="text-sm font-medium text-gray-700 col-span-1"
                      >
                        세로 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative col-span-3">
                        <Input
                          id="height"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.height}
                          onChange={(e) =>
                            handleInputChange("height", e.target.value)
                          }
                          onKeyDown={(e) => {
                            handleKeyDown(e, "productLength");
                            if (e.key === "-") e.preventDefault();
                          }}
                          className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          mm
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Product Length */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label
                    htmlFor="productLength"
                    className="text-sm font-medium text-gray-700 col-span-1"
                  >
                    제품 길이 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative col-span-3">
                        <Input
                          id="productLength"
                          type="number"
                          step="0.001"
                          min="0"
                          value={formData.productLength}
                          onChange={(e) =>
                            handleInputChange("productLength", e.target.value)
                          }
                          onKeyDown={(e) => {
                            handleKeyDown(e, "quantity");
                            // Prevent negative sign input
                            if (e.key === "-") {
                              e.preventDefault();
                            }
                          }}
                          className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                        />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      mm
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Plate-specific fields */}
            {materialType === "sheet" && (
              <>
                {/* Thickness */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label
                    htmlFor="plateThickness"
                    className="text-sm font-medium text-gray-700 col-span-1"
                  >
                    두께 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative col-span-3">
                    <Input
                      id="plateThickness"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.plateThickness}
                      onChange={(e) =>
                        handleInputChange("plateThickness", e.target.value)
                      }
                      onKeyDown={(e) => {
                        handleKeyDown(e, "plateWidth");
                        if (e.key === "-") e.preventDefault();
                      }}
                      className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      T
                    </span>
                  </div>
                </div>

                {/* Width */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label
                    htmlFor="plateWidth"
                    className="text-sm font-medium text-gray-700 col-span-1"
                  >
                    폭 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative col-span-3">
                    <Input
                      id="plateWidth"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.plateWidth}
                      onChange={(e) =>
                        handleInputChange("plateWidth", e.target.value)
                      }
                      onKeyDown={(e) => {
                        handleKeyDown(e, "plateLength");
                        if (e.key === "-") e.preventDefault();
                      }}
                      className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      mm
                    </span>
                  </div>
                </div>

                {/* Length */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label
                    htmlFor="plateLength"
                    className="text-sm font-medium text-gray-700 col-span-1"
                  >
                    길이 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative col-span-3">
                    <Input
                      id="plateLength"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.plateLength}
                      onChange={(e) =>
                        handleInputChange("plateLength", e.target.value)
                      }
                      onKeyDown={(e) => {
                        handleKeyDown(e, "quantity");
                        if (e.key === "-") e.preventDefault();
                      }}
                      className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      mm
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label
                htmlFor="quantity"
                className="text-sm font-medium text-gray-700 col-span-1"
              >
                수량 <span className="text-red-500">*</span>
              </Label>
              <div className="relative col-span-3">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  onKeyDown={(e) => {
                    handleKeyDown(e, "cuttingLoss");
                    if (e.key === "-") e.preventDefault();
                  }}
                  className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  pcs
                </span>
              </div>
            </div>

            {/* Cutting Loss - Only for rod materials */}
            {materialType === "rod" && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <Label
                    htmlFor="cuttingLoss"
                    className="text-sm font-medium text-gray-700 col-span-1"
                  >
                    절삭 손실 <span className="text-red-500">*</span>
                  </Label>
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="relative flex-1">
                      <Input
                        id="cuttingLoss"
                        type="number"
                        min="0"
                        value={formData.cuttingLoss}
                        onChange={(e) =>
                          handleInputChange("cuttingLoss", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                          }
                          if (e.key === "-") e.preventDefault();
                        }}
                        className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        mm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showCommonLoss}
                        onCheckedChange={setShowCommonLoss}
                      />
                      <Label className="text-xs text-gray-600">상세 설정</Label>
                    </div>
                  </div>
                </div>

                {showCommonLoss && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor="headCut"
                          className="text-xs font-medium text-gray-600"
                        >
                          헤드 절삭 (mm)
                        </Label>
                        <Input
                          id="headCut"
                          type="number"
                          value={formData.headCut}
                          onChange={(e) =>
                            handleInputChange("headCut", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          className="h-8 text-sm border-gray-300 focus:border-[#3182F6]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="tailCut"
                          className="text-xs font-medium text-gray-600"
                        >
                          테일 절삭 (mm)
                        </Label>
                        <Input
                          id="tailCut"
                          type="number"
                          value={formData.tailCut}
                          onChange={(e) =>
                            handleInputChange("tailCut", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          className="h-8 text-sm border-gray-300 focus:border-[#3182F6]"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Material Settings Card - Show when material is selected */}
        {formData.materialType && getCurrentMaterialInfo() && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-[#3182F6] rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-900">
                재질 기본 설정
              </h3>
              <span className="text-xs text-gray-500">(수정 가능)</span>
            </div>

            {materialType === "rod" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="standardBarLength"
                    className="text-sm font-medium text-gray-700"
                  >
                    표준 봉재 길이 (mm)
                  </Label>
                  <Input
                    id="standardBarLength"
                    type="number"
                    min="0"
                    value={formData.standardBarLength}
                    onChange={(e) =>
                      handleInputChange("standardBarLength", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "-") e.preventDefault();
                    }}
                    className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="materialDensity"
                    className="text-sm font-medium text-gray-700"
                  >
                    재질 밀도 (g/cm³)
                  </Label>
                  <Input
                    id="materialDensity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.materialDensity}
                    onChange={(e) =>
                      handleInputChange("materialDensity", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "-") e.preventDefault();
                    }}
                    className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="materialPrice"
                    className="text-sm font-medium text-gray-700"
                  >
                    봉재 단가 (₩/kg)
                  </Label>
                  <Input
                    id="materialPrice"
                    type="number"
                    min="0"
                    value={formData.materialPrice}
                    onChange={(e) =>
                      handleInputChange("materialPrice", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "-") e.preventDefault();
                    }}
                    className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="materialDensity"
                    className="text-sm font-medium text-gray-700"
                  >
                    재질 밀도 (g/cm³)
                  </Label>
                  <Input
                    id="materialDensity"
                    type="number"
                    step="0.01"
                    value={formData.materialDensity}
                    onChange={(e) =>
                      handleInputChange("materialDensity", e.target.value)
                    }
                    className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="plateUnitPrice"
                    className="text-sm font-medium text-gray-700"
                  >
                    판재 단가 (₩/kg)
                  </Label>
                  <Input
                    id="plateUnitPrice"
                    type="number"
                    value={formData.plateUnitPrice}
                    onChange={(e) =>
                      handleInputChange("plateUnitPrice", e.target.value)
                    }
                    className="h-9 text-sm border-gray-300 focus:border-[#3182F6] focus:ring-[#3182F6]/20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrap Calculation Card - Only for rod materials */}
        {materialType === "rod" && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header with Toggle Switch */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    스크랩 계산
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>제품 중량을 입력하면 스크랩을 고려한 실제 재료비를 계산합니다</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    isScrapCalculationEnabled ? "text-green-700" : "text-gray-500"
                  )}>
                    {isScrapCalculationEnabled ? "활성화" : "비활성화"}
                  </span>
                  <Switch
                    checked={isScrapCalculationEnabled}
                    onCheckedChange={(checked) => {
                      setIsScrapCalculationEnabled(checked);
                      if (!checked) {
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
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </div>
            </div>

            {/* Content Area - Only show when enabled */}
            {isScrapCalculationEnabled && (
              <div className="p-4 space-y-4 bg-green-50/30">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="actualProductWeight"
                      className="text-sm font-medium text-gray-700"
                    >
                      제품 실 중량 (g)
                    </Label>
                    <Input
                      id="actualProductWeight"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.actualProductWeight}
                      onChange={(e) =>
                        handleInputChange("actualProductWeight", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const recoveryField =
                            document.getElementById("recoveryRatio");
                          if (recoveryField) {
                            recoveryField.focus();
                          }
                        }
                        // Prevent negative sign input
                        if (e.key === "-") {
                          e.preventDefault();
                        }
                      }}
                      placeholder="실제 제품 1개 중량"
                      className="h-9 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="recoveryRatio"
                      className="text-sm font-medium text-gray-700"
                    >
                      스크랩 환산 비율 (%)
                    </Label>
                    {isCustomRecoveryRatio ? (
                      <div className="flex items-center gap-2">
                        <Input
                          id="recoveryRatio"
                          type="number"
                          value={formData.recoveryRatio}
                          onChange={(e) =>
                            handleInputChange("recoveryRatio", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const scrapUnitPriceField =
                                document.getElementById("scrapUnitPrice");
                              if (scrapUnitPriceField) {
                                scrapUnitPriceField.focus();
                              }
                            }
                          }}
                          className="h-9 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500/20 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCustomRecoveryRatio(false)}
                          className="h-9 px-3 text-xs"
                        >
                          선택
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={isCustomRecoveryRatio ? "custom" : formData.recoveryRatio}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setIsCustomRecoveryRatio(true);
                          } else {
                            setIsCustomRecoveryRatio(false);
                            handleInputChange("recoveryRatio", value);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-green-500">
                          <SelectValue placeholder="환산 비율을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="custom">직접입력</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="scrapUnitPrice"
                      className="text-sm font-medium text-gray-700"
                    >
                      스크랩 단가 (₩/kg)
                    </Label>
                    <Input
                      id="scrapUnitPrice"
                      type="number"
                      min="0"
                      value={formData.scrapUnitPrice}
                      onChange={(e) =>
                        handleInputChange("scrapUnitPrice", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const actualProductWeightField =
                            document.getElementById("actualProductWeight");
                          if (actualProductWeightField) {
                            actualProductWeightField.focus();
                          }
                        }
                        if (e.key === "-") e.preventDefault();
                      }}
                      placeholder="스크랩 kg당 가격"
                      className="h-9 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                {/* Status indicator */}
                <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-800 font-medium">
                      스크랩 계산이 활성화되었습니다
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    모든 필드를 입력하면 스크랩을 고려한 실제 재료비가 계산됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* Inactive state message */}
            {!isScrapCalculationEnabled && (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-500 mb-2">
                  스크랩 계산이 비활성화되어 있습니다
                </div>
                <div className="text-xs text-gray-400">
                  위의 토글 스위치를 활성화하여 스크랩을 고려한 정확한 재료비를 계산하세요
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleReset}
          className="w-full h-10 text-sm font-medium bg-[#3182F6] hover:bg-[#2563EB] text-white rounded-lg shadow-sm"
        >
          새로 계산하기
        </Button>
      </div>

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              로그인 필요
            </DialogTitle>
            <DialogDescription>
              스크랩 기능을 사용하려면 로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setIsLoginDialogOpen(false)}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={() => {
                setIsLoggedIn(true);
                setIsLoginDialogOpen(false);
              }}
              className="flex-1"
            >
              로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수동 계산 버튼 - 실시간 자동 계산이 비활성화된 경우에만 표시 */}
      {!autoCalculateEnabled && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={handleManualCalculate}
            className="w-full"
            size="lg"
            disabled={!formData.materialType || !formData.quantity}
          >
            <Calculator className="h-4 w-4 mr-2" />
            계산하기
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            실시간 자동 계산이 비활성화되어 있습니다. 계산하기 버튼을 눌러 결과를 확인하세요.
          </p>
        </div>
      )}
    </TooltipProvider>
  );
};
