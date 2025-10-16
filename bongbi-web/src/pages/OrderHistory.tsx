import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import analytics from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Filter,
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  scrapSavings?: number;
  wastage?: number;
  totalWeight?: number;
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
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());

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

  // Load saved orders from localStorage on component mount
  useEffect(() => {
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
  }, []);

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

  const getUtilizationGrade = (rate: number) => {
    if (rate >= 90)
      return { label: "완벽", color: "bg-green-100 text-green-700" };
    if (rate >= 80)
      return { label: "좋음", color: "bg-blue-100 text-blue-700" };
    if (rate >= 70)
      return { label: "양호", color: "bg-yellow-100 text-yellow-700" };
    if (rate >= 60)
      return { label: "경고", color: "bg-orange-100 text-orange-700" };
    return { label: "나쁨", color: "bg-red-100 text-red-700" };
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
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

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

  // 삭제 모드 토글
  const handleDeleteModeToggle = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedForDelete(new Set());
  };

  // 개별 선택/해제
  const handleSelectForDelete = (orderId: string) => {
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedForDelete(newSelected);
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedForDelete.size === filteredAndSortedOrders.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(filteredAndSortedOrders.map(order => order.id)));
    }
  };

  // 선택된 항목들 삭제
  const handleDeleteSelected = () => {
    if (selectedForDelete.size === 0) {
      toast.error("삭제할 항목을 선택해주세요.");
      return;
    }

    const updatedOrders = savedOrders.filter(order => !selectedForDelete.has(order.id));
    setSavedOrders(updatedOrders);
    
    if (updatedOrders.length > 0) {
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    } else {
      localStorage.removeItem("savedOrders");
    }
    
    toast.success(`${selectedForDelete.size}개 항목이 삭제되었습니다.`);
    setSelectedForDelete(new Set());
    setIsDeleteMode(false);
  };

  const filteredAndSortedOrders = savedOrders
    .filter(
      (order) =>
        (order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMaterialTypeDisplay(order.materialType)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
        isDateInRange(order.timestamp, dateFilter)
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
    });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 overflow-x-hidden" style={{ writingMode: 'horizontal-tb', textOrientation: 'mixed' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ writingMode: 'horizontal-tb' }}>
              주문 내역
            </h1>
          <p className="text-muted-foreground whitespace-normal break-words leading-snug tracking-normal text-sm sm:text-base max-w-[65ch]" style={{ writingMode: 'horizontal-tb' }}>
            저장된 자재 계산 내역과 주문 정보를 확인하고 관리하세요
          </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isDeleteMode ? (
              <Button
                variant="outline"
                onClick={handleDeleteModeToggle}
                disabled={savedOrders.length === 0}
                className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDeleteModeToggle}
                  className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={selectedForDelete.size === 0}
                  className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제 ({selectedForDelete.size})
                </Button>
              </div>
            )}
            <Button disabled={savedOrders.length === 0} className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3" onClick={() => { try { analytics.track('export_downloaded', { format: 'json' }); } catch {} }}>
              <Download className="h-4 w-4 mr-2" />
              내역 내보내기
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              저장된 계산 내역 ({savedOrders.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="제품명이나 재질로 검색..."
                  className="max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    날짜 필터
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">기간 선택</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={dateFilter === "today" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDateFilter("today")}
                        >
                          오늘
                        </Button>
                        <Button
                          variant={dateFilter === "yesterday" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDateFilter("yesterday")}
                        >
                          어제
                        </Button>
                        <Button
                          variant={dateFilter === "this_week" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDateFilter("this_week")}
                        >
                          이번 주
                        </Button>
                        <Button
                          variant={dateFilter === "this_month" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDateFilter("this_month")}
                        >
                          이번 달
                        </Button>
                        <Button
                          variant={dateFilter === "last_month" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDateFilter("last_month")}
                        >
                          지난 달
                        </Button>
                        <Button
                          variant={dateFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDateFilter("all")}
                        >
                          전체
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">사용자 지정 기간</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start-date" className="text-xs">시작일</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={customDateStart}
                            onChange={(e) => setCustomDateStart(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date" className="text-xs">종료일</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={customDateEnd}
                            onChange={(e) => setCustomDateEnd(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        variant={dateFilter === "custom" ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => setDateFilter("custom")}
                        disabled={!customDateStart || !customDateEnd}
                      >
                        사용자 지정 적용
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {filteredAndSortedOrders.length > 0 ? (
                  <Table className="table-auto md:table-fixed" style={{ writingMode: 'horizontal-tb' }}>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-b border-gray-200">
                        {isDeleteMode && (
                          <TableHead className="table-cell font-semibold text-gray-700 text-center min-w-0 align-middle w-12">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={selectedForDelete.size === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label="전체 선택"
                              />
                            </div>
                          </TableHead>
                        )}
                        <TableHead
                          className="table-cell font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors min-w-0 align-middle"
                          onClick={() => handleSort("productName")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            제품명
                            {getSortIcon("productName")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="hidden sm:table-cell font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors min-w-0 align-middle"
                          onClick={() => handleSort("materialType")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            재질
                            {getSortIcon("materialType")}
                          </div>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold text-gray-700 min-w-0 align-middle">
                          규격/형태
                        </TableHead>
                        <TableHead
                          className="table-cell font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors min-w-0 align-middle"
                          onClick={() => handleSort("quantity")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            수량
                            {getSortIcon("quantity")}
                          </div>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold text-gray-700 min-w-0 align-middle">
                          봉재/활용률
                        </TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold text-gray-700 min-w-0 align-middle">
                          고객사
                        </TableHead>
                        <TableHead
                          className="hidden sm:table-cell font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors text-right min-w-0 align-middle"
                          onClick={() => handleSort("totalCost")}
                        >
                          <div className="flex items-center gap-2 justify-end min-w-0">
                            총 소재비
                            {getSortIcon("totalCost")}
                          </div>
                        </TableHead>
                        <TableHead
                          className="hidden sm:table-cell font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors min-w-0 align-middle"
                          onClick={() => handleSort("timestamp")}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            저장일시
                            {getSortIcon("timestamp")}
                          </div>
                        </TableHead>
                        <TableHead className="table-cell font-semibold text-gray-700 text-center min-w-0 align-middle">
                          작업
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedOrders.map((order, index) => (
                        <TableRow
                          key={order.id}
                          className={cn(
                            "border-b border-gray-100 hover:bg-blue-50/50 transition-colors",
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                            !isDeleteMode && "cursor-pointer"
                          )}
                          onClick={!isDeleteMode ? () => handleOrderClick(order) : undefined}
                        >
                          {isDeleteMode && (
                            <TableCell className="table-cell text-center py-4 min-w-0 align-middle w-12">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedForDelete.has(order.id)}
                                  onCheckedChange={() => handleSelectForDelete(order.id)}
                                  aria-label={`${order.productName} 선택`}
                                />
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="table-cell font-medium text-gray-900 py-4 min-w-0 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 bg-[#3182F6] rounded-full"></div>
                              <span className="font-semibold hover:text-blue-600 transition-colors whitespace-nowrap truncate max-w-[20ch] block">
                                {order.productName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-gray-700 min-w-0 align-middle">
                            <div className="font-medium">
                              {getMaterialTypeDisplay(order.materialType)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.isPlate
                                ? "판재"
                                : getShapeDisplayName(order.shape)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-gray-700 min-w-0 align-middle">
                            {order.isPlate ? (
                              <div>
                                <div className="font-medium whitespace-nowrap truncate max-w-[12ch]">
                                  {order.plateThickness} × {order.plateWidth} ×{" "}
                                  {order.plateLength}
                                </div>
                                <div className="text-xs text-gray-500">
                                  T × W × L (mm)
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium whitespace-nowrap truncate max-w-[10ch]">
                                  {order.shape === "rectangle" &&
                                  order.width &&
                                  order.height
                                    ? `${order.width} × ${order.height}mm`
                                    : `⌀${order.diameter}mm`}
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap truncate max-w-[10ch]">
                                  {order.standardBarLength}mm 봉재
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="table-cell text-gray-700 min-w-0 align-middle">
                            <div className="font-semibold text-lg whitespace-nowrap truncate max-w-[8ch]">
                              {order.quantity}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.isPlate ? "장" : "개"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-gray-700 min-w-0 align-middle">
                            {order.isPlate ? (
                              <div className="text-gray-400 text-sm">-</div>
                            ) : (
                              <div>
                                <div className="font-medium whitespace-nowrap">
                                  {order.barsNeeded} 봉
                                </div>
                                <Badge
                                  size="sm"
                                  className={cn(
                                    "text-xs shrink-0 whitespace-nowrap",
                                    getUtilizationGrade(order.utilizationRate)
                                      .color,
                                  )}
                                >
                                  {order.utilizationRate.toFixed(1)}%
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-gray-700 min-w-0 align-middle">
                            <div className="font-medium">
                              {order.customer || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right min-w-0 align-middle">
                            <div className="font-bold text-lg text-blue-600 whitespace-nowrap truncate max-w-[12ch]">
                              {formatCurrency(order.totalCost)}
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap truncate max-w-[10ch]">
                              {formatCurrency(order.unitCost)}/
                              {order.isPlate ? "장" : "개"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-gray-600 min-w-0 align-middle">
                            <div className="text-sm whitespace-nowrap truncate max-w-[10ch]">
                              {formatDate(order.timestamp).split(" ")[0]}
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap truncate max-w-[10ch]">
                              {formatDate(order.timestamp).split(" ")[1]}
                            </div>
                          </TableCell>
                          <TableCell className="table-cell text-center min-w-0 align-middle shrink-0 whitespace-nowrap text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:border-blue-200 shrink-0 whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOrder(order);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              수정
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-16 bg-gray-50">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      저장된 주문이 없습니다
                    </h3>
                    <p className="text-gray-500 text-lg">
                      소재 계산기에서 계산 결과를 저장하면 여기에 표시됩니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {isEditMode ? "주문 정보 수정" : "소재 계산서 상세 정보"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "주문 정보를 수정하고 저장할 수 있습니다"
                  : "저장된 계산 결과의 상세 정보를 확인할 수 있습니다"}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      기본 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditMode ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-productName">제품명</Label>
                            <Input
                              id="edit-productName"
                              value={editedOrder?.productName || ""}
                              onChange={(e) => setEditedOrder(prev => prev ? {...prev, productName: e.target.value} : null)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-customer">고객사</Label>
                            <Input
                              id="edit-customer"
                              value={editedOrder?.customer || ""}
                              onChange={(e) => setEditedOrder(prev => prev ? {...prev, customer: e.target.value} : null)}
                              placeholder="고객사명을 입력하세요"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-deliveryUnitPrice">납품 단가 (원)</Label>
                            <Input
                              id="edit-deliveryUnitPrice"
                              type="number"
                              value={editedOrder?.deliveryUnitPrice || ""}
                              onChange={(e) => setEditedOrder(prev => prev ? {...prev, deliveryUnitPrice: Number(e.target.value)} : null)}
                              placeholder="납품 단가를 입력하세요"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-deliveryDate">납기일</Label>
                            <Input
                              id="edit-deliveryDate"
                              type="date"
                              value={editedOrder?.deliveryDate ? new Date(editedOrder.deliveryDate).toISOString().split('T')[0] : ""}
                              onChange={(e) => setEditedOrder(prev => prev ? {...prev, deliveryDate: e.target.value ? new Date(e.target.value) : undefined} : null)}
                            />
                          </div>
                        </div>

                        {editedOrder?.deliveryUnitPrice && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-sm text-blue-700 mb-1">총 납품가액 (자동 계산)</div>
                            <div className="text-lg font-semibold text-blue-700">
                              {formatNumber((editedOrder.deliveryUnitPrice || 0) * (editedOrder.quantity || 0))} 원
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 font-semibold w-16 flex-shrink-0">소재</span>
                              <span className="font-medium">{getMaterialTypeDisplay(editedOrder?.materialType || "")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 font-semibold w-16 flex-shrink-0">규격</span>
                              <span className="font-medium">
                                {editedOrder?.isPlate
                                  ? `${editedOrder?.plateThickness} x ${editedOrder?.plateWidth} x ${editedOrder?.plateLength}`
                                  : editedOrder?.shape === "rectangle"
                                    ? `${editedOrder?.width}x${editedOrder?.height}mm`
                                    : `${editedOrder?.diameter}mm`}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 font-semibold w-16 flex-shrink-0">수량</span>
                              <span className="font-medium">{editedOrder?.quantity} {editedOrder?.isPlate ? "장" : "개"}</span>
                            </div>
                            {!editedOrder?.isPlate && (
                              <div className="flex items-center gap-3">
                                <span className="text-gray-600 font-semibold w-16 flex-shrink-0">필요 봉수</span>
                                <span className="font-medium">{editedOrder?.barsNeeded} 봉</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 font-semibold w-16 flex-shrink-0">제품명</span>
                          <span className="font-medium">{selectedOrder?.productName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 font-semibold w-16 flex-shrink-0">소재</span>
                          <span className="font-medium">{getMaterialTypeDisplay(selectedOrder?.materialType || "")}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 font-semibold w-16 flex-shrink-0">{selectedOrder?.isPlate ? "규격" : "직경"}</span>
                          <span className="font-medium">
                            {selectedOrder?.isPlate
                              ? `${selectedOrder?.plateThickness} x ${selectedOrder?.plateWidth} x ${selectedOrder?.plateLength}`
                              : selectedOrder?.shape === "rectangle"
                                ? `${selectedOrder?.width}x${selectedOrder?.height}mm`
                                : `${selectedOrder?.diameter}mm`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 font-semibold w-16 flex-shrink-0">고객사</span>
                          <span className="font-medium">{selectedOrder?.customer || "-"}</span>
                        </div>
                        {!selectedOrder?.isPlate && (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-600 font-semibold w-16 flex-shrink-0">필요 봉수</span>
                            <span className="font-medium">{selectedOrder?.barsNeeded} 봉</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Calculation Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      계산 요약
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 mb-1">수량</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedOrder.quantity}{" "}
                          {selectedOrder.isPlate ? "장" : "개"}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 mb-1">
                          개당 소재비
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(selectedOrder.unitCost)}
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1">
                          총 소재비
                        </div>
                        <div className="text-lg font-semibold text-blue-700">
                          {formatCurrency(selectedOrder.totalCost)}
                        </div>
                      </div>

                      {!selectedOrder.isPlate && (
                        <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                          <div className="text-xs text-green-700 mb-1">
                            소재 활용률
                          </div>
                          <div className="text-lg font-semibold text-green-700">
                            {selectedOrder.utilizationRate.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scrap Information (if available) */}
                    {!selectedOrder.isPlate &&
                      selectedOrder.scrapSavings && selectedOrder.scrapSavings > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                              <div className="text-xs text-orange-700 mb-1">
                                스크랩 중량
                              </div>
                              <div className="text-sm font-semibold text-orange-700">
                                {selectedOrder.wastage && selectedOrder.totalWeight ? (
                                  (selectedOrder.wastage / 100) * selectedOrder.totalWeight
                                ).toFixed(2) : "0"}{" "}
                                kg
                              </div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                              <div className="text-xs text-orange-700 mb-1">
                                스크랩비
                              </div>
                              <div className="text-sm font-semibold text-orange-700">
                                {formatCurrency(selectedOrder.scrapSavings)}
                              </div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                              <div className="text-xs text-purple-700 mb-1">
                                실 소재비
                              </div>
                              <div className="text-sm font-semibold text-purple-700">
                                {formatCurrency(
                                  selectedOrder.totalCost -
                                    selectedOrder.scrapSavings,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* Additional Information (Optional) */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      추가 정보 (선택사항)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">
                          납품 단가
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {(isEditMode ? editedOrder : selectedOrder)?.deliveryUnitPrice
                            ? `${formatNumber((isEditMode ? editedOrder : selectedOrder)?.deliveryUnitPrice || 0)} 원`
                            : "미설정"}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">
                          총 납품가액
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {(isEditMode ? editedOrder : selectedOrder)?.deliveryUnitPrice
                            ? `${formatNumber(((isEditMode ? editedOrder : selectedOrder)?.deliveryUnitPrice || 0) * ((isEditMode ? editedOrder : selectedOrder)?.quantity || 0))} 원`
                            : "미설정"}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">납기일</div>
                        <div className="text-sm font-medium text-gray-900">
                          {(isEditMode ? editedOrder : selectedOrder)?.deliveryDate
                            ? new Date((isEditMode ? editedOrder : selectedOrder)?.deliveryDate || new Date()).toLocaleDateString("ko-KR")
                            : "미설정"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamp */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      저장 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        저장일시: {formatDate((isEditMode ? editedOrder : selectedOrder)?.timestamp || new Date())}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                {isEditMode && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OrderHistory;