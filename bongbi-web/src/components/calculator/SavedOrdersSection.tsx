import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Package, Copy, Share, ChevronDown, Trash2 } from "lucide-react";
import { getMaterialDisplayName } from "@/data/materialDefaults";

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
  // Additional form fields
  productLength: string;
  cuttingLoss: string;
  headCut: string;
  tailCut: string;
  customer: string;
  productWeight: string;
  actualProductWeight: string; // 제품 실 중량
  recoveryRatio: string;
  scrapUnitPrice: string;
  scrapPrice: string;
  materialDensity: string;
  materialPrice: string;
  plateUnitPrice: string;
  // Calculation results
  standardBarLength: number;
  totalCost: number;
  unitCost: number;
  utilizationRate: number;
  scrapSavings: number;
  wastage: number;
  totalWeight: number;
  timestamp: Date;
  isPlate?: boolean;
}

interface SavedOrdersSectionProps {
  onAddOrder?: (order: OrderItem) => void;
  materialType?: "rod" | "sheet";
}

export const SavedOrdersSection = ({
  onAddOrder,
  materialType,
}: SavedOrdersSectionProps) => {
  const [savedOrders, setSavedOrders] = useState<OrderItem[]>([]);
  const [isOrderListOpen, setIsOrderListOpen] = useState(true);
  const [sessionId] = useState(() => Date.now().toString());

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

  // Initialize session and load/cleanup saved orders
  useEffect(() => {
    // Set current session
    localStorage.setItem("currentSession", sessionId);

    // Load existing temporary orders from current session
    const stored = localStorage.getItem("tempSavedOrders");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if data is from current session (within last 24 hours)
        const isValidSession = data.sessionId &&
          data.timestamp &&
          (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000;

        if (isValidSession && data.orders) {
          const orders = data.orders.map((order: any) => ({
            ...order,
            timestamp: new Date(order.timestamp),
          }));
          setSavedOrders(orders);
        } else {
          // Clear old session data
          localStorage.removeItem("tempSavedOrders");
        }
      } catch (error) {
        console.error("Failed to load temporary saved orders:", error);
        localStorage.removeItem("tempSavedOrders");
      }
    }

    // Cleanup function: don't remove data on unmount (keep during browser session)
    return () => {
      // Data will persist until manually deleted or new session starts
    };
  }, [sessionId]);

  // Save orders to localStorage whenever savedOrders changes
  useEffect(() => {
    if (savedOrders.length > 0) {
      const data = {
        orders: savedOrders,
        sessionId,
        timestamp: Date.now(),
      };
      localStorage.setItem("tempSavedOrders", JSON.stringify(data));
    } else {
      localStorage.removeItem("tempSavedOrders");
    }
  }, [savedOrders, sessionId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + " 원";
  };

  const getMaterialTypeDisplay = (materialType: string) => {
    return getMaterialDisplayName(materialType);
  };

  const addOrder = (order: OrderItem) => {
    setSavedOrders((prev) => [order, ...prev]);
    setIsOrderListOpen(true);

    toast.success("주문이 임시 저장되었습니다!", {
      description: `${order.productName} - 계산결과 저장하기 버튼으로 영구 저장하세요`,
    });
  };

  // Expose addOrder function to parent component
  useEffect(() => {
    if (onAddOrder) {
      onAddOrder(addOrder as any);
    }
  }, [onAddOrder]);

  // 동일 스펙 주문 합산 함수
  const consolidateOrders = (orders: OrderItem[]) => {
    const consolidated: { [key: string]: {
      materialType: string;
      shape: string;
      diameter: string;
      width: string;
      height: string;
      standardBarLength: number;
      totalBars: number;
    }} = {};

    orders.forEach(order => {
      // 봉재만 처리 (판재는 제외)
      if (order.isPlate) return;

      // 스펙 키 생성 (재질, 형태, 직경, 봉길이)
      const specKey = `${order.materialType}-${order.shape}-${
        order.shape === "rectangle" ? `${order.width}x${order.height}` : order.diameter
      }-${order.standardBarLength}`;

      if (consolidated[specKey]) {
        // 동일 스펙이면 봉수 합산
        consolidated[specKey].totalBars += order.barsNeeded;
      } else {
        // 새로운 스펙 추가
        consolidated[specKey] = {
          materialType: order.materialType,
          shape: order.shape,
          diameter: order.diameter,
          width: order.width,
          height: order.height,
          standardBarLength: order.standardBarLength,
          totalBars: order.barsNeeded
        };
      }
    });

    return Object.values(consolidated);
  };

  const handleCopyConsolidatedOrders = () => {
    if (savedOrders.length === 0) {
      toast.error("저장된 주문이 없습니다!");
      return;
    }

    // 봉재 주문만 필터링
    const rodOrders = savedOrders.filter(order => !order.isPlate);

    if (rodOrders.length === 0) {
      toast.error("봉재 주문이 없습니다!");
      return;
    }

    const consolidatedOrders = consolidateOrders(rodOrders);

    const text = consolidatedOrders
      .map((item, index) => {
        const materialName = getMaterialTypeDisplay(item.materialType);
        const shapeName = getShapeDisplayName(item.shape);
        const diameterText = item.shape === "rectangle" && item.width && item.height
          ? `${item.width} x ${item.height}mm`
          : `${item.diameter}mm`;

        return `${index + 1}. ${materialName} / ${shapeName} / ${diameterText} / ${item.standardBarLength}mm / ${item.totalBars}봉`;
      })
      .join("\n");

    const finalText = `[자재 주문서]\n${new Date().toLocaleDateString("ko-KR")} 주문\n\n${text}`;

    navigator.clipboard.writeText(finalText);
    toast.success(`자재 주문서가 복사되었습니다! (${consolidatedOrders.length}개 항목)`);
  };

  const handleCopyAllOrders = () => {
    if (savedOrders.length === 0) {
      toast.error("저장된 주문이 없습니다!");
      return;
    }

    const text = savedOrders
      .map((order, index) =>
        order.isPlate
          ? `
[주문 ${index + 1}]
제품명: ${order.productName}
생산수량: ${order.quantity} 장
재질: ${getMaterialTypeDisplay(order.materialType)}
규격: ${order.plateThickness} x ${order.plateWidth} x ${order.plateLength}
총 비용: ${formatCurrency(order.totalCost)}
단위 비용: ${formatCurrency(order.unitCost)}
저장 일시: ${order.timestamp.toLocaleString("ko-KR")}`
          : `
[주문 ${index + 1}]
제품명: ${order.productName}
재질: ${getMaterialTypeDisplay(order.materialType)}
직경: ${
              order.shape === "rectangle" && order.width && order.height
                ? `${order.width} x ${order.height} mm`
                : `${order.diameter}mm`
            }
표준 봉재 길이: ${order.standardBarLength}mm
주문 봉재: ${order.barsNeeded} bars
    `.trim(),
      )
      .join("\n\n" + "=".repeat(50) + "\n\n");

    const finalText = `[봉비서 자재 주문 목록]\n생성일시: ${new Date().toLocaleString("ko-KR")}\n총 ${savedOrders.length}개 주문\n\n${"=".repeat(50)}\n\n${text}`;

    navigator.clipboard.writeText(finalText);
    toast.success(`전체 주문 목록(${savedOrders.length}개)이 복사되었습니다!`);
  };

  const handleShareAllOrders = () => {
    if (savedOrders.length === 0) {
      toast.error("저장된 주문이 없습니다!");
      return;
    }
    toast.success(
      `전체 주문 목록(${savedOrders.length}개) 공유 기능을 준비중입니다!`,
    );
  };

  const removeOrder = (id: string) => {
    const updatedOrders = savedOrders.filter((order) => order.id !== id);
    setSavedOrders(updatedOrders);
  };

  const clearAllOrders = () => {
    setSavedOrders([]);
    localStorage.removeItem("tempSavedOrders");
    toast.success("모든 주문이 삭제되었습니다!");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <Collapsible open={isOrderListOpen} onOpenChange={setIsOrderListOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#3182F6] rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">
                  저장된 주문 ({savedOrders.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyConsolidatedOrders();
                  }}
                  className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50"
                  disabled={savedOrders.length === 0}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  복사
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareAllOrders();
                  }}
                  className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-50"
                  disabled={savedOrders.length === 0}
                >
                  <Share className="h-3 w-3 mr-1" />
                  공유
                </Button>
                {savedOrders.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllOrders();
                    }}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    삭제
                  </Button>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform text-gray-400",
                    isOrderListOpen && "rotate-180",
                  )}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3">
            {savedOrders.length > 0 ? (
              <div className="space-y-1">
                {savedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border-l-3 border-l-[#3182F6] bg-[#3182F6]/5 rounded-r-md py-1.5 px-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        {order.isPlate ? (
                          <>
                            <span className="font-medium text-gray-900">
                              {order.productName}
                            </span>
                            <span className="text-gray-400">,</span>
                            <span className="text-gray-700">
                              {getMaterialTypeDisplay(order.materialType)}
                            </span>
                            <span className="text-gray-400">,</span>
                            <span className="text-gray-700">
                              {order.plateThickness} x {order.plateWidth} x{" "}
                              {order.plateLength}
                            </span>
                            <span className="text-gray-400">,</span>
                            <span className="text-gray-700">
                              {order.quantity}장
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-gray-900">
                              {order.productName}
                            </span>
                            <span className="text-gray-400"> · </span>
                            <span className="text-gray-700">
                              {getMaterialTypeDisplay(order.materialType)}{" "}
                              {getShapeDisplayName(order.shape)}
                            </span>
                            <span className="text-gray-400"> · </span>
                            <span className="text-gray-700">
                              {order.shape === "rectangle" &&
                              order.width &&
                              order.height
                                ? `${order.width} x ${order.height}mm`
                                : `${order.diameter}mm`}
                            </span>
                            <span className="text-gray-400"> · </span>
                            <span className="text-gray-700">
                              {order.standardBarLength}mm
                            </span>
                            <span className="text-gray-400"> · </span>
                            <span className="text-gray-700">
                              {order.barsNeeded} 봉
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-3 items-center">
                        {!order.isPlate && (
                          <div className="text-right">
                            <span className="text-gray-600 text-sm">
                              {order.quantity} pcs
                            </span>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#3182F6]">
                            {formatCurrency(order.totalCost)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeOrder(order.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Package className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium mb-1">
                  아직 저장된 주문이 없습니다
                </p>
                <p className="text-xs text-gray-500">
                  계산 완료 후 "주문 저장" 버튼을 클릭하여 주문을 저장하세요
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
