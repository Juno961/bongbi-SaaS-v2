import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Search,
  Download,
  Package,
  Edit,
  Calendar,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMaterialDisplayName } from "@/data/materialDefaults";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  barsNeeded: number;
  materialType: string;
  shape: string;
  diameter: string;
  width: string;
  height: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  standardBarLength: number;
  totalCost: number;
  unitCost: number;
  utilizationRate: number;
  timestamp: Date;
  isPlate?: boolean;
  customer?: string;
  deliveryUnitPrice?: number;
  deliveryDate?: Date;
  // 추가 필드들
  productLength?: string;
  headCut?: string;
  tailCut?: string;
  cuttingLoss?: string;
  totalWeight?: number;
  productWeight?: string;
  actualProductWeight?: string;
  materialDensity?: string;
  materialPrice?: number;
  scrapSavings?: number;
  scrapWeight?: number;
  recoveryRatio?: string;
  scrapUnitPrice?: number;
}

type SortField =
  | "productName"
  | "materialType"
  | "quantity"
  | "totalCost"
  | "timestamp"
  | "utilizationRate";
type SortOrder = "asc" | "desc";

type DateFilter = "today" | "yesterday" | "this_week" | "this_month" | "last_month" | "custom" | "all";

const OrderHistory = () => {
  const [savedOrders, setSavedOrders] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState<OrderItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  // Function to get Korean shape names for display
  const getShapeDisplayName = (shape: string) => {
    switch (shape) {
      case "circle":
        return "원봉";
      case "hexagon":
        return "육각봉";
      case "square":
        return "정사각봉";
      case "rectangle":
        return "직사각봉";
      default:
        return shape;
    }
  };

  // Load saved orders and settings from localStorage on component mount
  useEffect(() => {
    // Load orders
    const stored = localStorage.getItem("savedOrders");
    if (stored) {
      try {
        const orders = JSON.parse(stored).map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp),
        }));
        // Sort by timestamp, newest first
        setSavedOrders(
          orders.sort(
            (a: OrderItem, b: OrderItem) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
        );
      } catch (error) {
        console.error("Failed to load saved orders:", error);
      }
    }

    // Load settings
    const savedSettings = localStorage.getItem("orderHistorySettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSortField(settings.sortField || "timestamp");
        setSortOrder(settings.sortOrder || "desc");
        setDateFilter(settings.dateFilter || "all");
        setMaterialFilter(settings.materialFilter || "all");
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    const settings = {
      sortField,
      sortOrder,
      dateFilter,
      materialFilter
    };
    localStorage.setItem("orderHistorySettings", JSON.stringify(settings));
  }, [sortField, sortOrder, dateFilter, materialFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + " 원";
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount));
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  const getMaterialTypeDisplay = (materialType: string) => {
    return getMaterialDisplayName(materialType);
  };

  // Helper components for improved modal
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );

  const getUtilizationGrade = (rate: number) => {
    if (rate >= 95) return { color: "bg-green-100 text-green-800", label: "우수" };
    if (rate >= 85) return { color: "bg-blue-100 text-blue-800", label: "양호" };
    if (rate >= 75) return { color: "bg-yellow-100 text-yellow-800", label: "보통" };
    return { color: "bg-red-100 text-red-800", label: "개선필요" };
  };



  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  // Multi-select functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredAndSortedOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  // Bulk operations
  const handleBulkCopy = async () => {
    if (selectedOrders.length === 0) {
      toast.error("복사할 주문을 선택해주세요!");
      return;
    }

    const selectedOrderData = savedOrders.filter(order => 
      selectedOrders.includes(order.id)
    );
    
    const copyText = selectedOrderData.map((order, index) => 
      `${index + 1}. ${order.productName} | ${getMaterialTypeDisplay(order.materialType)} | ${
        order.isPlate 
          ? `${order.plateThickness}×${order.plateWidth}×${order.plateLength}mm`
          : order.shape === "rectangle"
            ? `${order.width}×${order.height}mm`
            : `⌀${order.diameter}mm`
      } | ${order.quantity}${order.isPlate ? "장" : "개"} | ${formatCurrency(order.totalCost)}`
    ).join('\n');

    const finalText = `[주문 목록]\n${new Date().toLocaleDateString("ko-KR")} 복사\n\n${copyText}`;

    try {
      await navigator.clipboard.writeText(finalText);
      toast.success(`선택된 ${selectedOrders.length}개 주문이 복사되었습니다!`);
      setSelectedOrders([]);
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) {
      toast.error("삭제할 주문을 선택해주세요!");
      return;
    }

    const updatedOrders = savedOrders.filter(order => 
      !selectedOrders.includes(order.id)
    );
    
    setSavedOrders(updatedOrders);
    if (updatedOrders.length > 0) {
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    } else {
      localStorage.removeItem("savedOrders");
    }
    
    toast.success(`선택된 ${selectedOrders.length}개 주문이 삭제되었습니다!`);
    setSelectedOrders([]);
  };

  const handleCopyOrder = async (order: OrderItem) => {
    const copyText = `제품명: ${order.productName}
재질: ${getMaterialTypeDisplay(order.materialType)}
규격: ${order.isPlate 
      ? `${order.plateThickness}×${order.plateWidth}×${order.plateLength}mm`
      : order.shape === "rectangle" 
        ? `${order.width}×${order.height}mm`
        : `⌀${order.diameter}mm`
    }
수량: ${order.quantity}${order.isPlate ? "장" : "개"}
${!order.isPlate ? `필요 봉재: ${order.barsNeeded}봉` : ''}
총 소재비: ${formatCurrency(order.totalCost)}
${order.customer ? `고객사: ${order.customer}` : ''}
저장일시: ${formatDate(order.timestamp)}`;

    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("주문 정보가 클립보드에 복사되었습니다!");
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'a':
          e.preventDefault();
          handleSelectAll(true);
          break;
        case 'c':
          e.preventDefault();
          if (selectedOrders.length > 0) {
            handleBulkCopy();
          }
          break;
      }
    }
    if (e.key === 'Delete' && selectedOrders.length > 0) {
      e.preventDefault();
      handleBulkDelete();
    }
  }, [selectedOrders]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isDateInRange = (date: Date, filter: DateFilter): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    switch (filter) {
      case "today":
        return date >= today;
      case "yesterday":
        return date >= yesterday && date < today;
      case "this_week":
        return date >= startOfWeek;
      case "this_month":
        return date >= startOfMonth;
      case "last_month":
        return date >= startOfLastMonth && date <= endOfLastMonth;
      case "custom":
        if (customDateStart && customDateEnd) {
          const start = new Date(customDateStart);
          const end = new Date(customDateEnd);
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        }
        return true;
      default:
        return true;
    }
  };

  const handleEditOrder = (order: OrderItem) => {
    setSelectedOrder(order);
    setEditedOrder({ ...order });
    setIsEditMode(true);
    setIsDetailDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editedOrder) {
      const updatedOrders = savedOrders.map(order =>
        order.id === editedOrder.id ? editedOrder : order
      );
      setSavedOrders(updatedOrders);
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
      setIsEditMode(false);
      setEditedOrder(null);
      setIsDetailDialogOpen(false);
      toast.success("주문 정보가 성공적으로 수정되었습니다.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedOrder(null);
    setIsDetailDialogOpen(false);
  };

  const handleOrderClick = (order: OrderItem) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
    setIsEditMode(false);
  };

  const clearAllOrders = () => {
    setSavedOrders([]);
    localStorage.removeItem("savedOrders");
  };

  const deleteOrder = (orderId: string) => {
    const updatedOrders = savedOrders.filter((order) => order.id !== orderId);
    setSavedOrders(updatedOrders);
    if (updatedOrders.length > 0) {
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    } else {
      localStorage.removeItem("savedOrders");
    }
  };

  const filteredAndSortedOrders = useMemo(() => savedOrders
    .filter(
      (order) =>
        (order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMaterialTypeDisplay(order.materialType)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        isDateInRange(order.timestamp, dateFilter) &&
        (materialFilter === "all" || order.materialType === materialFilter)
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "productName":
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        case "materialType":
          aValue = getMaterialTypeDisplay(a.materialType).toLowerCase();
          bValue = getMaterialTypeDisplay(b.materialType).toLowerCase();
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "totalCost":
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        case "utilizationRate":
          aValue = a.utilizationRate;
          bValue = b.utilizationRate;
          break;
        case "timestamp":
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    }), [savedOrders, searchTerm, dateFilter, materialFilter, sortField, sortOrder]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Simple Page Header */}
        <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
              주문 내역
            </h1>
              <p className="text-gray-600 mb-3">
                저장된 자재 계산 내역을 확인하고 관리하세요
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  총 {savedOrders.length}건 저장됨
                </span>
                {filteredAndSortedOrders.length !== savedOrders.length && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {filteredAndSortedOrders.length}건 표시 중
                  </span>
                )}
          </div>
            </div>
            
            {/* Main Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" size="sm" disabled={savedOrders.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                엑셀 내보내기
              </Button>
            <Button
              variant="outline"
                size="sm" 
              onClick={clearAllOrders}
              disabled={savedOrders.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              전체 삭제
            </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Left: Search & Filters */}
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="제품명, 재질, 고객사로 검색..." 
                    className="pl-10 w-80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
                
                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                  <SelectTrigger className="w-36">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="전체 기간" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 기간</SelectItem>
                    <SelectItem value="today">오늘</SelectItem>
                    <SelectItem value="yesterday">어제</SelectItem>
                    <SelectItem value="this_week">이번 주</SelectItem>
                    <SelectItem value="this_month">이번 달</SelectItem>
                    <SelectItem value="last_month">지난 달</SelectItem>
                  </SelectContent>
                </Select>

                {/* Material Filter */}
                <Select value={materialFilter} onValueChange={setMaterialFilter}>
                  <SelectTrigger className="w-36">
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="전체 재질" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 재질</SelectItem>
                    <SelectItem value="aluminum">알루미늄</SelectItem>
                    <SelectItem value="sus304">SUS304</SelectItem>
                    <SelectItem value="sus303">SUS303</SelectItem>
                    <SelectItem value="brass">황동</SelectItem>
                    <SelectItem value="carbon_steel">탄소강</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Dropdown */}
                <Select 
                  value={`${sortField}-${sortOrder}`} 
                  onValueChange={(value) => {
                    const [field, order] = value.split('-') as [SortField, SortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                >
                  <SelectTrigger className="w-36">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp-desc">최신순</SelectItem>
                    <SelectItem value="timestamp-asc">오래된순</SelectItem>
                    <SelectItem value="totalCost-desc">금액 높은순</SelectItem>
                    <SelectItem value="totalCost-asc">금액 낮은순</SelectItem>
                    <SelectItem value="productName-asc">제품명 순</SelectItem>
                    <SelectItem value="utilizationRate-desc">활용률 높은순</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Right: Selection Actions */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedOrders.length > 0 && `${selectedOrders.length}개 선택됨`}
                </span>
                
                        <Button
                  variant="outline" 
                          size="sm"
                  onClick={handleBulkCopy}
                  disabled={selectedOrders.length === 0}
                        >
                  <Copy className="h-4 w-4 mr-2" />
                  선택 복사
                        </Button>
                
                        <Button
                  variant="outline" 
                          size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedOrders.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  선택 삭제
                        </Button>
                      </div>
                    </div>
          </CardContent>
        </Card>

        {/* Excel-style Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow className="border-b-2 border-gray-200">
                    {/* Checkbox Column */}
                    <TableHead className="w-12 text-center">
                      <Checkbox 
                        checked={selectedOrders.length === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    
                    {/* Cost Column (Most Important) */}
                    <TableHead className="w-40">
                      <div className="flex items-center gap-2 font-semibold text-gray-700">
                        총 금액
                      <Button
                          variant="ghost"
                        size="sm"
                          className="h-auto p-0"
                          onClick={() => handleSort("totalCost")}
                      >
                          {getSortIcon("totalCost")}
                      </Button>
                    </div>
                    </TableHead>

                    {/* Product Name Column */}
                    <TableHead className="w-36">
                      <div className="flex items-center gap-2 font-semibold text-gray-700">
                        제품명
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0"
                        onClick={() => handleSort("productName")}
                      >
                          {getSortIcon("productName")}
                        </Button>
                        </div>
                      </TableHead>

                    {/* Material/Spec Column */}
                    <TableHead className="w-56">
                      <div className="font-semibold text-gray-700">재질/규격</div>
                      </TableHead>

                    {/* Quantity/Bars Column */}
                    <TableHead className="w-40">
                      <div className="flex items-center gap-2 font-semibold text-gray-700">
                        수량/봉재
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0"
                        onClick={() => handleSort("quantity")}
                      >
                          {getSortIcon("quantity")}
                        </Button>
                        </div>
                      </TableHead>

                    {/* Customer Column */}
                    <TableHead className="w-32">
                      <div className="font-semibold text-gray-700">고객사</div>
                      </TableHead>

                    {/* Date Column */}
                    <TableHead className="w-28">
                      <div className="flex items-center gap-2 font-semibold text-gray-700">
                        날짜
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0"
                        onClick={() => handleSort("timestamp")}
                      >
                          {getSortIcon("timestamp")}
                        </Button>
                        </div>
                      </TableHead>

                    {/* Action Column */}
                    <TableHead className="w-24 text-center">
                      <div className="font-semibold text-gray-700">작업</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                  {filteredAndSortedOrders.length > 0 ? (
                    filteredAndSortedOrders.map((order, index) => (
                      <TableRow
                        key={order.id}
                        className={cn(
                          "hover:bg-blue-50/50 transition-colors border-b border-gray-100 cursor-pointer",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                          selectedOrders.includes(order.id) && "bg-blue-100/50"
                        )}
                        onClick={() => handleOrderClick(order)}
                      >
                        {/* Checkbox */}
                        <TableCell 
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox 
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          />
                        </TableCell>

                        {/* Cost (Emphasized) */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(order.totalCost)}
                          </div>
                          <div className="text-xs text-gray-500">
                              ↳ {formatCurrency(order.unitCost)}/{order.isPlate ? "장" : "개"}
                            </div>
                          </div>
                        </TableCell>

                        {/* Product Name */}
                        <TableCell>
                          <div className="font-semibold text-gray-900 truncate">
                            {order.productName}
                              </div>
                        </TableCell>

                        {/* Material/Spec */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">
                              {getMaterialTypeDisplay(order.materialType)}
                              <span className="ml-1 text-gray-600">
                                {order.isPlate ? "판재" : getShapeDisplayName(order.shape)}
                              </span>
                              </div>
                            <div className="text-sm text-gray-600 font-mono">
                              {order.isPlate 
                                ? `${order.plateThickness}×${order.plateWidth}×${order.plateLength}mm`
                                : order.shape === "rectangle"
                                  ? `${order.width}×${order.height}mm×${order.standardBarLength}mm`
                                  : `⌀${order.diameter}mm×${order.standardBarLength}mm`
                              }
                            </div>
                              </div>
                        </TableCell>

                        {/* Quantity/Bars */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">
                              {order.quantity.toLocaleString()}{order.isPlate ? "장" : "개"}
                              {!order.isPlate && ` / ${order.barsNeeded}봉`}
                          </div>
                            {!order.isPlate && (
                              <Badge
                                className={cn(
                                  "text-xs",
                                  getUtilizationGrade(order.utilizationRate).color
                                )}
                              >
                                활용률: {order.utilizationRate.toFixed(1)}%
                              </Badge>
                          )}
                          </div>
                        </TableCell>

                        {/* Customer */}
                        <TableCell>
                          <div className="text-sm text-gray-700 truncate">
                            {order.customer || "-"}
                          </div>
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {formatDate(order.timestamp).split(" ")[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(order.timestamp).split(" ")[1]}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs hover:bg-blue-50"
                              onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                              편집
                          </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs hover:bg-green-50"
                              onClick={() => handleCopyOrder(order)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              복사
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <Package className="h-16 w-16 text-gray-300" />
                          <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    저장된 주문이 없습니다
                  </h3>
                            <p className="text-gray-500">
                              자재 계산기에서 계산 결과를 저장하면 여기에 표시됩니다
                  </p>
                </div>
                        </div>
                      </TableCell>
                    </TableRow>
              )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Order Detail Dialog (View Mode) */}
        <Dialog open={isDetailDialogOpen && !isEditMode} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="space-y-3">
                {/* 금액과 제품명 */}
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">
                      💰 {formatCurrency(selectedOrder?.totalCost || 0)}
                    </span>
                    {selectedOrder?.scrapSavings && selectedOrder.scrapSavings > 0 && (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className="text-2xl font-bold text-gray-700">
                          {formatCurrency((selectedOrder.totalCost || 0) - (selectedOrder.scrapSavings || 0))}
                        </span>
                      </>
                    )}
                  </div>
                  {selectedOrder?.productName && selectedOrder.productName !== "0" && selectedOrder.productName.trim() !== "" && (
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedOrder.productName}
                    </span>
                  )}
                </DialogTitle>
                
                {/* 고객사와 납품일 */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    <span className="font-medium">고객사:</span> {selectedOrder?.customer && selectedOrder.customer !== "0" && selectedOrder.customer.trim() !== "" ? selectedOrder.customer : "미지정"}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>
                    <span className="font-medium">납품일:</span> {
                      selectedOrder?.deliveryDate 
                        ? new Date(selectedOrder.deliveryDate).toLocaleDateString("ko-KR")
                        : "미설정"
                    }
                  </span>
                </div>
              </div>
            </DialogHeader>

            {selectedOrder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                {/* 기본 정보 카드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      📋 기본 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow 
                      label="재질" 
                      value={`${getMaterialTypeDisplay(selectedOrder.materialType)} ${getShapeDisplayName(selectedOrder.shape)}`} 
                    />
                    <InfoRow 
                      label="규격" 
                      value={selectedOrder.isPlate 
                        ? `${selectedOrder.plateThickness}×${selectedOrder.plateWidth}×${selectedOrder.plateLength}mm`
                        : selectedOrder.shape === "rectangle"
                          ? `${selectedOrder.width}×${selectedOrder.height}mm`
                          : `⌀${selectedOrder.diameter}mm`
                      } 
                    />
                    {/* 봉재 길이 정보 추가 */}
                    {!selectedOrder.isPlate && (
                      <InfoRow 
                        label="봉재 길이" 
                        value={`${selectedOrder.standardBarLength}mm`} 
                      />
                    )}
                    {/* 제품 길이 정보 추가 */}
                    {!selectedOrder.isPlate && selectedOrder.productLength && (
                      <InfoRow 
                        label="제품 길이" 
                        value={`${selectedOrder.productLength}mm`} 
                      />
                    )}
                    <InfoRow 
                      label="수량" 
                      value={`${selectedOrder.quantity}${selectedOrder.isPlate ? "장" : "개"}${!selectedOrder.isPlate ? ` / ${selectedOrder.barsNeeded}봉` : ""}`} 
                    />
                    {!selectedOrder.isPlate && (
                      <InfoRow 
                        label="활용률" 
                        value={
                          <Badge className={getUtilizationGrade(selectedOrder.utilizationRate).color}>
                            {selectedOrder.utilizationRate.toFixed(1)}%
                          </Badge>
                        } 
                      />
                    )}
                    <InfoRow 
                      label="저장일시" 
                      value={formatDate(selectedOrder.timestamp)} 
                    />
                  </CardContent>
                </Card>

                {/* 비용 정보 카드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      💰 비용 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow 
                      label="원가 소재비" 
                      value={
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(selectedOrder.totalCost)}
                        </span>
                      } 
                    />
                    {selectedOrder.scrapSavings && selectedOrder.scrapSavings > 0 && (
                      <>
                        <InfoRow 
                          label="스크랩 반영" 
                          value={
                            <span className="text-lg font-bold text-gray-700">
                              {formatCurrency(selectedOrder.totalCost - selectedOrder.scrapSavings)}
                            </span>
                          } 
                        />
                        <InfoRow 
                          label="스크랩 차액" 
                          value={formatCurrency(selectedOrder.scrapSavings)} 
                        />
                      </>
                    )}
                    <InfoRow 
                      label="단가" 
                      value={selectedOrder.scrapSavings && selectedOrder.scrapSavings > 0 ? (
                        <div className="space-y-1">
                          <div className="text-gray-600 text-sm">
                            원가: {formatCurrency(selectedOrder.unitCost)}
                          </div>
                          <div className="font-semibold">
                            반영: {formatCurrency((selectedOrder.totalCost - selectedOrder.scrapSavings) / selectedOrder.quantity)}
                          </div>
                        </div>
                      ) : (
                        `${formatCurrency(selectedOrder.unitCost)}/${selectedOrder.isPlate ? "장" : "개"}`
                      )} 
                    />
                    <InfoRow 
                      label="고객사" 
                      value={selectedOrder.customer && selectedOrder.customer !== "0" && selectedOrder.customer.trim() !== "" ? selectedOrder.customer : "미지정"} 
                    />
                    <InfoRow 
                      label="납품 단가" 
                      value={selectedOrder.deliveryUnitPrice && selectedOrder.deliveryUnitPrice > 0
                        ? `${formatNumber(selectedOrder.deliveryUnitPrice)}원/${selectedOrder.isPlate ? "장" : "개"}`
                        : "미설정"
                      } 
                    />
                    {selectedOrder.deliveryUnitPrice && selectedOrder.deliveryUnitPrice > 0 && (
                      <InfoRow 
                        label="총 납품가액" 
                        value={
                          <span className="text-lg font-bold text-blue-600">
                            {formatNumber(selectedOrder.deliveryUnitPrice * selectedOrder.quantity)}원
                          </span>
                        } 
                      />
                    )}
                    <InfoRow 
                      label="납기일" 
                      value={selectedOrder.deliveryDate 
                        ? new Date(selectedOrder.deliveryDate).toLocaleDateString("ko-KR")
                        : "미설정"
                      } 
                    />
                  </CardContent>
                </Card>
              </div>
            )}
 
            {/* 상세 정보 펼치기 섹션 */}
            {selectedOrder && (
              <div className="mt-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsDetailExpanded(!isDetailExpanded)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 hover:text-gray-800"
                >
                  {isDetailExpanded ? "▲ 상세 정보 숨기기" : "▼ 상세 정보 보기 (치수, 계산, 스크랩)"}
                </Button>
                
                <Collapsible open={isDetailExpanded} onOpenChange={setIsDetailExpanded}>
                  <CollapsibleContent>
                    <div className={`grid grid-cols-1 gap-4 mt-4 ${
                      !selectedOrder.isPlate && 
                      selectedOrder.scrapSavings && selectedOrder.scrapSavings > 0
                        ? "md:grid-cols-3" 
                        : "md:grid-cols-2"
                    }`}>
                      {/* 치수 상세 */}
                      {!selectedOrder.isPlate && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              🔧 치수 상세
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <InfoRow label="제품 길이" value={selectedOrder.productLength && parseFloat(selectedOrder.productLength) > 0 ? `${selectedOrder.productLength}mm` : "-"} />
                            <InfoRow label="절삭 손실" value={selectedOrder.cuttingLoss && parseFloat(selectedOrder.cuttingLoss) > 0 ? `${selectedOrder.cuttingLoss}mm` : "-"} />
                            <InfoRow label="단위 길이" value={selectedOrder.productLength && parseFloat(selectedOrder.productLength) > 0 ? `${(parseFloat(selectedOrder.productLength || "0") + parseFloat(selectedOrder.cuttingLoss || "0")).toFixed(1)}mm` : "-"} />
                            <InfoRow label="헤드 절삭" value={selectedOrder.headCut && parseFloat(selectedOrder.headCut) > 0 ? `${selectedOrder.headCut}mm` : "-"} />
                            <InfoRow label="테일 절삭" value={selectedOrder.tailCut && parseFloat(selectedOrder.tailCut) > 0 ? `${selectedOrder.tailCut}mm` : "-"} />
                            <InfoRow label="사용 가능 길이" value={selectedOrder.productLength && parseFloat(selectedOrder.productLength) > 0 ? `${(selectedOrder.standardBarLength - parseFloat(selectedOrder.headCut || "0") - parseFloat(selectedOrder.tailCut || "0")).toFixed(0)}mm` : "-"} />
                          </CardContent>
                        </Card>
                      )}

                      {/* 계산 분석 */}
                      {!selectedOrder.isPlate && (
                        <Card className="bg-gray-50 border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              📊 계산 분석
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {selectedOrder.productLength && parseFloat(selectedOrder.productLength) > 0 && (
                              <InfoRow label="봉재당 생산" value={`${Math.floor((selectedOrder.standardBarLength - parseFloat(selectedOrder.headCut || "0") - parseFloat(selectedOrder.tailCut || "0")) / (parseFloat(selectedOrder.productLength || "0") + parseFloat(selectedOrder.cuttingLoss || "0")))}개`} />
                            )}
                            <InfoRow label="총 중량" value={selectedOrder.totalWeight && selectedOrder.totalWeight > 0 ? `${selectedOrder.totalWeight.toFixed(3)}kg` : "-"} />
                            <InfoRow label="제품 중량" value={selectedOrder.productWeight && selectedOrder.productWeight !== "0" && parseFloat(selectedOrder.productWeight) > 0 ? `${selectedOrder.productWeight}g` : "-"} />
                            <InfoRow label="실제 제품 중량" value={selectedOrder.actualProductWeight && selectedOrder.actualProductWeight !== "0" && parseFloat(selectedOrder.actualProductWeight) > 0 ? `${selectedOrder.actualProductWeight}g` : "-"} />
                            <InfoRow label="밀도" value={selectedOrder.materialDensity && selectedOrder.materialDensity !== "0" && parseFloat(selectedOrder.materialDensity) > 0 ? `${selectedOrder.materialDensity}g/cm³` : "-"} />
                            <InfoRow label="재료 단가" value={selectedOrder.materialPrice && selectedOrder.materialPrice > 0 ? `${formatNumber(selectedOrder.materialPrice)}원/kg` : "-"} />
                          </CardContent>
                        </Card>
                      )}

                      {/* 스크랩 데이터 (중립적 표현) */}
                      {!selectedOrder.isPlate && 
                       selectedOrder.scrapSavings && selectedOrder.scrapSavings > 0 && (
                        <Card className="bg-gray-50 border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              ♻️ 스크랩 데이터
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <InfoRow label="스크랩 중량" value={selectedOrder.scrapWeight && selectedOrder.scrapWeight > 0 ? `${selectedOrder.scrapWeight.toFixed(3)}kg` : "-"} />
                            <InfoRow label="환산 비율" value={`${selectedOrder.recoveryRatio || 100}%`} />
                            <InfoRow label="스크랩 단가" value={selectedOrder.scrapUnitPrice && selectedOrder.scrapUnitPrice > 0 ? `${formatNumber(selectedOrder.scrapUnitPrice)}원/kg` : "-"} />
                            <InfoRow label="스크랩 가치" value={formatCurrency(selectedOrder.scrapSavings)} />
                            <InfoRow label="반영 비율" value={`${((selectedOrder.scrapSavings / selectedOrder.totalCost) * 100).toFixed(1)}%`} />
                            <InfoRow label="적용 후 단가" value={formatCurrency((selectedOrder.totalCost - selectedOrder.scrapSavings) / selectedOrder.quantity)} />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* 액션 버튼들 */}
            {selectedOrder && (
              <div className="flex justify-center gap-3 pt-4 border-t">
                <Button onClick={() => {
                  setEditedOrder({ ...selectedOrder });
                  setIsEditMode(true);
                }} className="flex-1 max-w-32">
                  <Edit className="h-4 w-4 mr-2" />
                  📝 편집
                </Button>
                <Button variant="outline" onClick={() => handleCopyOrder(selectedOrder)} className="flex-1 max-w-32">
                  <Copy className="h-4 w-4 mr-2" />
                  📋 복사
                </Button>
                <Button variant="outline" onClick={() => deleteOrder(selectedOrder.id)} className="flex-1 max-w-32 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  🗑️ 삭제
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Order Edit Dialog (Edit Mode) */}
        <Dialog open={isDetailDialogOpen && isEditMode} onOpenChange={() => {
          setIsEditMode(false);
          setIsDetailDialogOpen(false);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                ✏️ 주문 편집 - {editedOrder?.productName}
              </DialogTitle>
              <DialogDescription>
                주문 정보를 수정하고 저장할 수 있습니다
              </DialogDescription>
            </DialogHeader>

            {editedOrder && (
              <div className="space-y-6 my-6">
                {/* 편집 가능한 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      📝 편집 가능한 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-productName">제품명</Label>
                            <Input
                              id="edit-productName"
                              value={editedOrder?.productName || ""}
                          onChange={(e) => setEditedOrder(prev => 
                            prev ? {...prev, productName: e.target.value} : null
                          )}
                          placeholder="제품명을 입력하세요"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-customer">고객사</Label>
                            <Input
                              id="edit-customer"
                              value={editedOrder?.customer || ""}
                          onChange={(e) => setEditedOrder(prev => 
                            prev ? {...prev, customer: e.target.value} : null
                          )}
                              placeholder="고객사명을 입력하세요"
                            />
                          </div>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                        <Label htmlFor="edit-deliveryUnitPrice">
                          납품 단가 (원/{editedOrder?.isPlate ? "장" : "개"})
                        </Label>
                            <Input
                              id="edit-deliveryUnitPrice"
                              type="number"
                              value={editedOrder?.deliveryUnitPrice || ""}
                          onChange={(e) => setEditedOrder(prev => 
                            prev ? {...prev, deliveryUnitPrice: Number(e.target.value) || undefined} : null
                          )}
                              placeholder="납품 단가를 입력하세요"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-deliveryDate">납기일</Label>
                            <Input
                              id="edit-deliveryDate"
                              type="date"
                          value={editedOrder?.deliveryDate 
                            ? new Date(editedOrder.deliveryDate).toISOString().split('T')[0] 
                            : ""
                          }
                          onChange={(e) => setEditedOrder(prev => 
                            prev ? {...prev, deliveryDate: e.target.value ? new Date(e.target.value) : undefined} : null
                          )}
                            />
                          </div>
                        </div>

                                        {/* 실시간 계산 결과 */}
                    {editedOrder?.deliveryUnitPrice && editedOrder.deliveryUnitPrice > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">💰 총 납품가액</span>
                          <span className="text-xl font-bold text-blue-700">
                            {formatNumber(editedOrder.deliveryUnitPrice * editedOrder.quantity)}원
                              </span>
                            </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {formatNumber(editedOrder?.deliveryUnitPrice || 0)}원 × {editedOrder?.quantity || 0}{editedOrder?.isPlate ? "장" : "개"}
                            </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 계산 정보 (읽기 전용) */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      📊 계산 정보 (수정 불가)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {/* 기본 규격 정보 */}
                      <div className="flex flex-wrap items-center gap-1 text-gray-700">
                        <span className="font-medium">{getMaterialTypeDisplay(editedOrder?.materialType || "")}</span>
                        <span>•</span>
                        <span>{editedOrder?.isPlate ? "판재" : getShapeDisplayName(editedOrder?.shape || "")}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {editedOrder?.isPlate 
                            ? `${editedOrder?.plateThickness}×${editedOrder?.plateWidth}×${editedOrder?.plateLength}mm`
                            : editedOrder?.shape === "rectangle"
                              ? `${editedOrder?.width}×${editedOrder?.height}mm`
                              : `⌀${editedOrder?.diameter}mm`
                          }
                        </span>
                        {!editedOrder?.isPlate && editedOrder?.productLength && (
                          <>
                            <span>•</span>
                            <span>제품길이: <span className="font-mono">{editedOrder.productLength}mm</span></span>
                          </>
                      )}
                    </div>

                      {/* 수량 정보 */}
                      <div className="flex items-center gap-4 text-gray-700">
                        <span className="font-semibold">{editedOrder?.quantity?.toLocaleString()}{editedOrder?.isPlate ? "장" : "개"}</span>
                        {!editedOrder?.isPlate && (
                          <>
                            <span>•</span>
                            <span className="font-semibold">{editedOrder?.barsNeeded}봉</span>
                            <span>•</span>
                            <span>활용률: <span className="text-blue-600 font-semibold">{editedOrder?.utilizationRate?.toFixed(1)}%</span></span>
                            {editedOrder?.scrapSavings && editedOrder.scrapSavings > 0 && (
                              <>
                                <span>•</span>
                                <span>봉재당: <span className="font-semibold">{Math.floor((editedOrder?.standardBarLength - (parseFloat(editedOrder?.headCut || "0")) - (parseFloat(editedOrder?.tailCut || "0"))) / ((parseFloat(editedOrder?.productLength || "0")) + (parseFloat(editedOrder?.cuttingLoss || "0"))))}개</span></span>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* 비용 정보 (스크랩 중립적 표현) */}
                      <div className="pt-2 border-t border-gray-200">
                        {editedOrder?.scrapSavings && editedOrder.scrapSavings > 0 ? (
                          <div className="flex items-center gap-4">
                            <span className="text-blue-600 font-medium">
                              원가: {formatCurrency(editedOrder?.totalCost || 0)}
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-700 font-medium">
                              스크랩 반영: {formatCurrency((editedOrder?.totalCost || 0) - (editedOrder?.scrapSavings || 0))}
                            </span>
                        </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600 font-medium">총 소재비:</span>
                            <span className="text-blue-600 font-bold">{formatCurrency(editedOrder?.totalCost || 0)}</span>
                        </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                    </div>
            )}

            {/* 액션 버튼들 */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      <Save className="h-4 w-4 mr-2" />
                💾 저장
                    </Button>
                  </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OrderHistory;
