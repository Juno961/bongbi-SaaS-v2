import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import analytics from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings as SettingsIcon,
  RotateCcw,
  Plus,
  X,
  Calculator,
  Database,
  Wrench,
  BarChart3,
  Construction,
  HardDrive,
  Edit,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { materialDefaults, MaterialDefaults } from "@/data/materialDefaults";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditableMaterial extends MaterialDefaults {
  id: string;
  isNew?: boolean;
}

type SettingsTab = 'defaults' | 'calculation' | 'materials' | 'backup';

// Tab Button Component
interface TabButtonProps {
  id: SettingsTab;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton = ({ id, icon, label, active, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all shrink-0 min-w-[5rem] sm:min-w-[7rem]",
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    )}
    title={label}
  >
    <span className="shrink-0">{icon}</span>
    <span className="text-xs sm:text-sm whitespace-nowrap">{label}</span>
  </button>
);

// Setting Toggle Component
interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

const SettingToggle = ({ icon, title, description, checked, onToggle }: SettingToggleProps) => (
  <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
    <div className="flex items-center gap-3">
      <div className="text-xl">{icon}</div>
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onToggle} />
  </div>
);

// Material Card Component
interface MaterialCardProps {
  material: EditableMaterial;
  onEdit: () => void;
  onDelete: () => void;
  calculationSettings: any;
}

const MaterialCard = ({ material, onEdit, onDelete, calculationSettings }: MaterialCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg">{material.material}</CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3 w-3 mr-1" />
            편집
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-3 w-3 mr-1" />
            삭제
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">표준 길이:</span>
          <span className="font-medium">{material.standard_bar_length}mm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">밀도:</span>
          <span className="font-medium">{material.material_density}g/cm³</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">봉재 단가:</span>
          <span className="font-medium">{material.bar_unit_price.toLocaleString()}원/kg</span>
        </div>
        {/* 판재 단가 활성화 설정에 따라 조건부 표시 */}
        {calculationSettings.enablePlatePrice && (
          <div className="flex justify-between">
            <span className="text-gray-600">판재 단가:</span>
            <span className="font-medium">{material.plate_unit_price.toLocaleString()}원/kg</span>
          </div>
        )}
        {/* 스크랩 단가 표시 추가 */}
        <div className="flex justify-between">
          <span className="text-gray-600">스크랩 단가:</span>
          <span className="font-medium">{material.scrap_unit_price.toLocaleString()}원/kg</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Settings = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'defaults';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<EditableMaterial | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    material: "",
    standard_bar_length: 3000,
    material_density: 7.85,
    bar_unit_price: 0,
    plate_unit_price: 0,
    scrap_unit_price: 0,
  });
  // Convert materialDefaults to editable format
  const [materials, setMaterials] = useState<EditableMaterial[]>(
    Object.entries(materialDefaults).map(([key, data]) => ({
      id: key,
      ...data,
    })),
  );

  // Load custom material defaults from localStorage on mount
  useEffect(() => {
    const storedMaterials = localStorage.getItem("customMaterialDefaults");
    console.log("📂 [Settings] 초기화 - localStorage 확인:", storedMaterials ? "있음" : "없음");
    if (storedMaterials) {
      try {
        const customDefaults = JSON.parse(storedMaterials);
        console.log("📂 [Settings] localStorage 데이터:", customDefaults);
        // Merge built-in materials with custom materials
        const allMaterials: Record<string, MaterialDefaults> = { ...materialDefaults };
        Object.assign(allMaterials, customDefaults);
        
        console.log("📂 [Settings] 병합된 소재 목록:", Object.keys(allMaterials));
        const loadedMaterials = Object.entries(allMaterials).map(([key, data]) => ({
          id: key,
          ...(data as MaterialDefaults),
        }));
        setMaterials(loadedMaterials);
      } catch (error) {
        console.error("Failed to load custom material defaults:", error);
      }
    }
  }, []);

  // Update active tab when URL search params change
  useEffect(() => {
    const tab = (searchParams.get('tab') as SettingsTab) || 'defaults';
    setActiveTab(tab);
  }, [searchParams]);

  // Calculation settings state
  const [calculationSettings, setCalculationSettings] = useState({
    autoCalculate: true,
    saveHistory: true,
    enablePlatePrice: false, // 변경: false = 비활성화됨 (기본값)
  });

  // Load calculation settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem("calculationSettings");
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        // 기존 disablePlatePrice를 enablePlatePrice로 변환
        if (settings.hasOwnProperty('disablePlatePrice')) {
          settings.enablePlatePrice = !settings.disablePlatePrice;
          delete settings.disablePlatePrice;
          // 변환된 설정을 localStorage에 저장
          localStorage.setItem("calculationSettings", JSON.stringify(settings));
        }
        setCalculationSettings(settings);
      } catch (error) {
        console.error("Failed to load calculation settings:", error);
      }
    }
  }, []);

  // Save calculation settings to localStorage when they change
  const updateCalculationSetting = (key: string, value: boolean) => {
    const newSettings = { ...calculationSettings, [key]: value };
    setCalculationSettings(newSettings);
    localStorage.setItem("calculationSettings", JSON.stringify(newSettings));

    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent("calculationSettingsChanged", {
      detail: newSettings
    }));
  };

  // Default values state
  const [defaultValues, setDefaultValues] = useState({
    headCut: 20,
    tailCut: 250,
    scrapRatio: 100,
  });

  // Refs for direct DOM manipulation
  const headCutRef = useRef<HTMLInputElement>(null);
  const tailCutRef = useRef<HTMLInputElement>(null);
  const scrapRatioRef = useRef<HTMLInputElement>(null);

  // Load default values from localStorage on mount
  useEffect(() => {
    const storedDefaults = localStorage.getItem("defaultValues");
    if (storedDefaults) {
      try {
        const defaults = JSON.parse(storedDefaults);
        setDefaultValues(defaults);
        // Set input DOM values if refs are available
        if (headCutRef.current) headCutRef.current.value = defaults.headCut.toString();
        if (tailCutRef.current) tailCutRef.current.value = defaults.tailCut.toString();
        if (scrapRatioRef.current) scrapRatioRef.current.value = defaults.scrapRatio.toString();
      } catch (error) {
        console.error("Failed to load default values:", error);
      }
    }
  }, []);

  // Save default values to localStorage when they change
  const updateDefaultValues = (newValues: typeof defaultValues) => {
    setDefaultValues(newValues);
    localStorage.setItem("defaultValues", JSON.stringify(newValues));

    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent("defaultValuesChanged", {
      detail: newValues
    }));
  };

  // Safe number parsing function
  const safeParseNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Save all default values from form
  const saveDefaultValues = () => {
    const newValues = {
      headCut: safeParseNumber(headCutRef.current?.value || '0'),
      tailCut: safeParseNumber(tailCutRef.current?.value || '0'),
      scrapRatio: safeParseNumber(scrapRatioRef.current?.value || '0'),
    };

    setDefaultValues(newValues);
    localStorage.setItem("defaultValues", JSON.stringify(newValues));

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent("defaultValuesChanged", {
      detail: newValues
    }));
  };

  // Initialize input values on mount
  useEffect(() => {
    if (headCutRef.current) {
      headCutRef.current.value = defaultValues.headCut.toString();
    }
    if (tailCutRef.current) {
      tailCutRef.current.value = defaultValues.tailCut.toString();
    }
    if (scrapRatioRef.current) {
      scrapRatioRef.current.value = defaultValues.scrapRatio.toString();
    }
  }, [defaultValues]);

  const openAddMaterialModal = () => {
    setNewMaterial({
      material: "",
      standard_bar_length: 3000,
      material_density: 7.85,
      bar_unit_price: 0,
      plate_unit_price: 0,
      scrap_unit_price: 0,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNewMaterial = () => {
    // Validation
    if (!newMaterial.material.trim()) {
      toast.error("소재명을 입력해주세요.");
      return;
    }

    const newMaterialEntry: EditableMaterial = {
      id: `new_${Date.now()}`,
      ...newMaterial,
      isNew: true,
    };

    const updatedMaterials = [...materials, newMaterialEntry];
    setMaterials(updatedMaterials);

    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...materialData } = material;
      acc[id] = materialData;
      return acc;
    }, {} as Record<string, MaterialDefaults>);

    console.log("💾 [Settings] 저장할 소재 목록:", Object.keys(materialDefaults));
    console.log("💾 [Settings] 저장할 전체 데이터:", materialDefaults);
    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));

    toast.success("새 소재가 추가되었습니다.");
    setIsAddModalOpen(false);
  };

  const handleCancelAddMaterial = () => {
    setIsAddModalOpen(false);
    setNewMaterial({
      material: "",
      standard_bar_length: 3000,
      material_density: 7.85,
      bar_unit_price: 0,
      plate_unit_price: 0,
      scrap_unit_price: 0,
    });
  };

  const deleteMaterial = (id: string) => {
    const updatedMaterials = materials.filter((material) => material.id !== id);
    setMaterials(updatedMaterials);
    
    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...materialData } = material;
      acc[id] = materialData;
      return acc;
    }, {} as Record<string, MaterialDefaults>);
    
    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));
    
    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));
  };

  const updateMaterial = (
    id: string,
    field?: keyof MaterialDefaults,
    value?: string | number,
  ) => {
    const updatedMaterials = materials.map((material) => {
      if (material.id === id) {
        if (field !== undefined && value !== undefined) {
          // Single field update
          return { ...material, [field]: value };
        } else {
          // Full object update (for batch updates)
          return material;
        }
      }
      return material;
    });
    setMaterials(updatedMaterials);

    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...materialData } = material;
      acc[id] = materialData;
      return acc;
    }, {} as Record<string, MaterialDefaults>);

    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));
  };

  // Batch update material with all fields at once
  const updateMaterialBatch = (id: string, materialData: Partial<MaterialDefaults>) => {
    const updatedMaterials = materials.map((material) =>
      material.id === id ? { ...material, ...materialData } : material,
    );
    setMaterials(updatedMaterials);

    // Save to localStorage for persistence
    const materialDefaults = updatedMaterials.reduce((acc, material) => {
      const { id, isNew, ...data } = material;
      acc[id] = data;
      return acc;
    }, {} as Record<string, MaterialDefaults>);

    localStorage.setItem("customMaterialDefaults", JSON.stringify(materialDefaults));

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
      detail: materialDefaults
    }));
  };

  const resetToDefaults = () => {
    const confirmed = window.confirm(
      "모든 설정을 기본값으로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    );
    if (confirmed) {
      try {
        // 기본 재료 설정으로 복원
        const defaultMaterials = Object.entries(materialDefaults).map(([key, data]) => ({
          id: key,
          ...data,
        }));
        setMaterials(defaultMaterials);
        
        // 기본 계산 설정으로 복원
        const defaultCalculationSettings = {
          autoCalculate: true,
          saveHistory: true,
          enablePlatePrice: false, // 기본값: 비활성화
        };
        setCalculationSettings(defaultCalculationSettings);
        
        // 기본값 복원
        const defaultDefaults = {
          headCut: 20,
          tailCut: 250,
          scrapRatio: 100,
        };
        setDefaultValues(defaultDefaults);
        
        // localStorage에서 커스텀 설정 제거 (기본값 사용하도록)
        localStorage.removeItem("customMaterialDefaults");
        localStorage.setItem("calculationSettings", JSON.stringify(defaultCalculationSettings));
        localStorage.setItem("defaultValues", JSON.stringify(defaultDefaults));
        
        // 모든 연결된 컴포넌트에 초기화 알림
        window.dispatchEvent(new CustomEvent("calculationSettingsChanged", {
          detail: defaultCalculationSettings
        }));
        window.dispatchEvent(new CustomEvent("defaultValuesChanged", {
          detail: defaultDefaults
        }));
        window.dispatchEvent(new CustomEvent("materialDefaultsChanged", {
          detail: Object.entries(materialDefaults).reduce((acc, [key, data]) => {
            acc[key] = data;
            return acc;
          }, {} as Record<string, MaterialDefaults>)
        }));
        
        alert("모든 설정이 기본값으로 초기화되었습니다!");
      } catch (error) {
        console.error("설정 초기화 중 오류 발생:", error);
        alert("설정 초기화 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };



  // Handle material edit
  const handleEditMaterial = (material: EditableMaterial) => {
    setEditingMaterial(material);
    setIsEditModalOpen(true);
  };

  const handleSaveMaterial = () => {
    if (editingMaterial) {
      // Batch update all fields at once to avoid concurrency issues
      updateMaterialBatch(editingMaterial.id, {
        material: editingMaterial.material,
        standard_bar_length: editingMaterial.standard_bar_length,
        material_density: editingMaterial.material_density,
        bar_unit_price: editingMaterial.bar_unit_price,
        plate_unit_price: editingMaterial.plate_unit_price,
        scrap_unit_price: editingMaterial.scrap_unit_price,
      });

      toast.success("소재가 성공적으로 저장되었습니다.");
      setIsEditModalOpen(false);
      setEditingMaterial(null);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    if (window.confirm("이 소재를 삭제하시겠습니까?")) {
      deleteMaterial(id);
      toast.success("소재가 삭제되었습니다.");
    }
  };

  // Export/Import functions
  const exportSettings = () => {
    const settings = {
      materials,
      calculationSettings,
      defaultValues,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `bongbi-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success("설정이 내보내기 되었습니다.");

    // analytics: export downloaded
    try {
      analytics.track("export_downloaded", { format: 'json' });
    } catch {}
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        if (settings.materials) setMaterials(settings.materials);
        if (settings.calculationSettings) setCalculationSettings(settings.calculationSettings);
        if (settings.defaultValues) setDefaultValues(settings.defaultValues);
        
        toast.success("설정이 가져오기 되었습니다.");
      } catch (error) {
        toast.error("설정 파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  // Tab Content Components
  const DefaultsTab = () => {
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      saveDefaultValues();
    };

    return (
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cutting Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                절삭 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>선두 로스 (mm)</Label>
                <Input
                  ref={headCutRef}
                  type="number"
                  defaultValue={defaultValues.headCut}
                  name="headCut"
                  className="text-lg"
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label>후미 로스 (mm)</Label>
                <Input
                  ref={tailCutRef}
                  type="number"
                  defaultValue={defaultValues.tailCut}
                  name="tailCut"
                  className="text-lg"
                  placeholder="250"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scrap Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                스크랩 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>환산 비율 (%)</Label>
                <Input
                  ref={scrapRatioRef}
                  type="number"
                  defaultValue={defaultValues.scrapRatio}
                  name="scrapRatio"
                  className="text-lg"
                  placeholder="100"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden submit button for form submission */}
        <button type="submit" style={{ display: 'none' }} />
      </form>
    );
  };

  const CalculationTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          계산 옵션
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingToggle
          icon={<Calculator className="h-5 w-5" />}
          title="실시간 자동 계산"
          description="입력 변경 시 즉시 자동으로 계산합니다"
          checked={calculationSettings.autoCalculate}
          onToggle={(checked) => updateCalculationSetting('autoCalculate', checked)}
        />
        
        <SettingToggle
          icon={<HardDrive className="h-5 w-5" />}
          title="계산 이력 저장"
          description="모든 계산 내역을 기록으로 보관합니다"
          checked={calculationSettings.saveHistory}
          onToggle={(checked) => updateCalculationSetting('saveHistory', checked)}
        />
        
        <SettingToggle
          icon={<Calculator className="h-5 w-5" />}
          title="판재 단가 활성화"
          description="활성화 시 판재 전용 단가를 사용하고, 비활성화 시 봉재 단가를 사용합니다"
          checked={calculationSettings.enablePlatePrice}
          onToggle={(checked) => updateCalculationSetting('enablePlatePrice', checked)}
        />
      </CardContent>
    </Card>
  );

  const MaterialsTab = () => (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Construction className="h-5 w-5" />
          등록된 소재
        </h3>
        <Button onClick={openAddMaterialModal}>
          <Plus className="h-4 w-4 mr-2" />
          소재 추가
        </Button>
      </div>

      {/* Material Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(material => (
          <MaterialCard 
            key={material.id}
            material={material}
            onEdit={() => handleEditMaterial(material)}
            onDelete={() => handleDeleteMaterial(material.id)}
            calculationSettings={calculationSettings}
          />
        ))}
      </div>
    </div>
  );

  const BackupTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            데이터 백업
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              설정 내보내기
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: 'none' }}
                id="import-settings"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('import-settings')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                설정 가져오기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <RotateCcw className="h-5 w-5" />
            설정 초기화
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                모든 설정을 기본값으로 되돌립니다.
              </p>
              <p className="text-xs text-red-600">
                주의: 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <Button onClick={resetToDefaults} variant="outline" className="text-red-600 hover:text-red-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              모든 설정 초기화
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
          <p className="text-gray-600">
            재료 계산기 기본 설정 및 환경 설정을 구성하세요
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
          <TabButton 
            id="defaults" 
            icon={<Wrench className="h-4 w-4" />} 
            label="기본값" 
            active={activeTab === 'defaults'}
            onClick={() => setActiveTab('defaults')}
          />
          <TabButton 
            id="calculation" 
            icon={<BarChart3 className="h-4 w-4" />} 
            label="계산" 
            active={activeTab === 'calculation'}
            onClick={() => setActiveTab('calculation')}
          />
          <TabButton 
            id="materials" 
            icon={<Construction className="h-4 w-4" />} 
            label="소재" 
            active={activeTab === 'materials'}
            onClick={() => setActiveTab('materials')}
          />
          <TabButton 
            id="backup" 
            icon={<HardDrive className="h-4 w-4" />} 
            label="백업" 
            active={activeTab === 'backup'}
            onClick={() => setActiveTab('backup')}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'defaults' && <DefaultsTab />}
        {activeTab === 'calculation' && <CalculationTab />}
        {activeTab === 'materials' && <MaterialsTab />}
        {activeTab === 'backup' && <BackupTab />}
        {/* Material Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                소재 편집 - {editingMaterial?.material}
              </DialogTitle>
              <DialogDescription>
                소재의 상세 정보를 수정할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            
            {editingMaterial && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">기본 정보</h4>
                    <div className="space-y-2">
                      <Label>재료명</Label>
                      <Input
                        value={editingMaterial.material}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          material: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>표준 길이 (mm)</Label>
                      <Input
                        type="number"
                        value={editingMaterial.standard_bar_length}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          standard_bar_length: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>밀도 (g/cm³)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingMaterial.material_density}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          material_density: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>

                  {/* 가격 정보 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">가격 정보</h4>
                    <div className="space-y-2">
                      <Label>봉재 단가 (원/kg)</Label>
                      <Input
                        type="number"
                        value={editingMaterial.bar_unit_price}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          bar_unit_price: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                    {/* 판재 단가 활성화 설정에 따라 조건부 렌더링 */}
                    {calculationSettings.enablePlatePrice ? (
                      <div className="space-y-2">
                        <Label>판재 단가 (원/kg)</Label>
                        <Input
                          type="number"
                          value={editingMaterial.plate_unit_price}
                          onChange={(e) => setEditingMaterial({
                            ...editingMaterial,
                            plate_unit_price: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-gray-500">판재 단가 (비활성화됨)</Label>
                        <div className="p-3 bg-gray-50 border rounded-md">
                          <p className="text-sm text-gray-600">
                            설정 &gt; 계산에서 "판재 단가 활성화"를 켜면 판재 전용 단가를 설정할 수 있습니다. 현재는 봉재 단가를 사용합니다.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>스크랩 단가 (원/kg)</Label>
                      <Input
                        type="number"
                        value={editingMaterial.scrap_unit_price}
                        onChange={(e) => setEditingMaterial({
                          ...editingMaterial,
                          scrap_unit_price: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveMaterial}>
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Material Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                새 소재 추가
              </DialogTitle>
              <DialogDescription>
                새로운 소재의 상세 정보를 입력해주세요.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">기본 정보</h4>
                  <div className="space-y-2">
                    <Label>재료명 *</Label>
                    <Input
                      value={newMaterial.material}
                      onChange={(e) => setNewMaterial({
                        ...newMaterial,
                        material: e.target.value
                      })}
                      placeholder="예: SS400, ST37-2, SUS304 등"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>표준 길이 (mm)</Label>
                    <Input
                      type="number"
                      value={newMaterial.standard_bar_length}
                      onChange={(e) => setNewMaterial({
                        ...newMaterial,
                        standard_bar_length: parseInt(e.target.value) || 0
                      })}
                      placeholder="3000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>밀도 (g/cm³)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newMaterial.material_density}
                      onChange={(e) => setNewMaterial({
                        ...newMaterial,
                        material_density: parseFloat(e.target.value) || 0
                      })}
                      placeholder="7.85"
                    />
                  </div>
                </div>

                {/* 가격 정보 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">가격 정보</h4>
                  <div className="space-y-2">
                    <Label>봉재 단가 (원/kg)</Label>
                    <Input
                      type="number"
                      value={newMaterial.bar_unit_price}
                      onChange={(e) => setNewMaterial({
                        ...newMaterial,
                        bar_unit_price: parseInt(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                  {/* 판재 단가 활성화 설정에 따라 조건부 렌더링 */}
                  {calculationSettings.enablePlatePrice ? (
                    <div className="space-y-2">
                      <Label>판재 단가 (원/kg)</Label>
                      <Input
                        type="number"
                        value={newMaterial.plate_unit_price}
                        onChange={(e) => setNewMaterial({
                          ...newMaterial,
                          plate_unit_price: parseInt(e.target.value) || 0
                        })}
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-gray-500">판재 단가 (비활성화됨)</Label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        <p className="text-sm text-gray-600">
                          설정 &gt; 계산에서 "판재 단가 활성화"를 켜면 판재 전용 단가를 설정할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>스크랩 단가 (원/kg)</Label>
                    <Input
                      type="number"
                      value={newMaterial.scrap_unit_price}
                      onChange={(e) => setNewMaterial({
                        ...newMaterial,
                        scrap_unit_price: parseInt(e.target.value) || 0
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelAddMaterial}>
                취소
              </Button>
              <Button onClick={handleSaveNewMaterial}>
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
