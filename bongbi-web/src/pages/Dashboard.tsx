import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart3,
  Calculator,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronUp,
  Factory,
  Wrench,
  ClipboardList,
  Cog,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getMaterialDisplayName, getMaterialDefaults } from "@/data/materialDefaults";
import { WelcomeGuide, GuideStep } from "@/components/ui/onboarding-tour";

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
}

const Dashboard = () => {
  const [recentCalculations, setRecentCalculations] = useState<OrderItem[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    monthlyWorkload: 0,
    monthlyCost: 0,
    utilizationRate: 0,
    scrapRate: 0,
    monthlyWorkloadChange: 0,
    monthlyCostChange: 0,
    utilizationRateChange: 0,
    scrapRateChange: 0,
  });
  const [materialUsageData, setMaterialUsageData] = useState<{ material: string; usage: number }[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  // Calculate dashboard metrics from saved orders
  const calculateDashboardMetrics = (orders: OrderItem[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter orders for current month and previous month
    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousMonthYear;
    });

    // Calculate current month metrics
    const monthlyWorkload = currentMonthOrders.length;
    const monthlyCost = currentMonthOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
    const utilizationRate = currentMonthOrders.length > 0
      ? currentMonthOrders.reduce((sum, order) => sum + (order.utilizationRate || 0), 0) / currentMonthOrders.length
      : 0;
    const scrapRate = 100 - utilizationRate;

    // Calculate previous month metrics for comparison
    const prevMonthlyWorkload = previousMonthOrders.length;
    const prevMonthlyCost = previousMonthOrders.reduce((sum, order) => sum + (order.totalCost || 0), 0);
    const prevUtilizationRate = previousMonthOrders.length > 0
      ? previousMonthOrders.reduce((sum, order) => sum + (order.utilizationRate || 0), 0) / previousMonthOrders.length
      : 0;
    const prevScrapRate = 100 - prevUtilizationRate;

    // Calculate percentage changes
    const monthlyWorkloadChange = prevMonthlyWorkload > 0
      ? ((monthlyWorkload - prevMonthlyWorkload) / prevMonthlyWorkload) * 100
      : 0;
    const monthlyCostChange = prevMonthlyCost > 0
      ? ((monthlyCost - prevMonthlyCost) / prevMonthlyCost) * 100
      : 0;
    const utilizationRateChange = prevUtilizationRate > 0
      ? utilizationRate - prevUtilizationRate
      : 0;
    const scrapRateChange = prevScrapRate > 0
      ? scrapRate - prevScrapRate
      : 0;

    return {
      monthlyWorkload,
      monthlyCost,
      utilizationRate,
      scrapRate,
      monthlyWorkloadChange,
      monthlyCostChange,
      utilizationRateChange,
      scrapRateChange,
    };
  };

  // Calculate material usage data from saved orders
  const calculateMaterialUsageData = (orders: OrderItem[]) => {
    const materialUsage: Record<string, number> = {};

    orders.forEach(order => {
      const materialDefaults = getMaterialDefaults(order.materialType);
      if (materialDefaults) {
        const displayName = getMaterialDisplayName(order.materialType);
        const weight = order.totalWeight || 0;

        if (materialUsage[displayName]) {
          materialUsage[displayName] += weight;
        } else {
          materialUsage[displayName] = weight;
        }
      }
    });

    // Convert to array and sort by usage (descending)
    return Object.entries(materialUsage)
      .map(([material, usage]) => ({ material, usage: Math.round(usage) }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 8); // Show top 8 materials
  };

  // Load recent calculations and calculate metrics from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("savedOrders");
    if (stored) {
      try {
        const orders = JSON.parse(stored).map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp),
        }));

        // Sort by timestamp, newest first, and take only first 3 for recent calculations
        const recentOrders = orders
          .sort((a: OrderItem, b: OrderItem) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 3);
        setRecentCalculations(recentOrders);

        // Calculate dashboard metrics
        const metrics = calculateDashboardMetrics(orders);
        setDashboardMetrics(metrics);

        // Calculate material usage data
        const materialData = calculateMaterialUsageData(orders);
        setMaterialUsageData(materialData);
      } catch (error) {
        console.error("Failed to load recent calculations:", error);
      }
    }
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + " 원";
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Hero Section - Action Centered */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
              <Factory className="h-10 w-10 text-blue-600" />
              <span className="hidden sm:inline">안녕하세요, 봉비서입니다</span>
              <span className="sm:hidden text-center">
                안녕하세요,<br />봉비서입니다
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              CNC 재료 계산 및 공장 효율성 현황을 확인하세요
            </p>
          </div>
          
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link to="/calculator">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer ring-2 ring-blue-500 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Wrench className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold text-lg mb-1">새로 계산하기</h3>
                  <p className="text-sm text-gray-600">재료비 계산 시작</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/orders">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <ClipboardList className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                  <h3 className="font-semibold text-lg mb-1">주문 내역</h3>
                  <p className="text-sm text-gray-600">저장된 계산 결과</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/settings?tab=materials">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Cog className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                  <h3 className="font-semibold text-lg mb-1">소재 설정</h3>
                  <p className="text-sm text-gray-600">재료 정보 관리</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Key Metrics - 2x2 Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 이번 달 현황
              <Badge variant="outline">{new Date().getMonth() + 1}월</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 총 소재비 */}
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {new Intl.NumberFormat("ko-KR").format(Math.round(dashboardMetrics.monthlyCost))}원
                </div>
                <div className="text-sm text-gray-600 mb-2">총 소재비</div>
                <div className={`text-xs font-medium flex items-center justify-center gap-1 ${
                  dashboardMetrics.monthlyCostChange >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {dashboardMetrics.monthlyCostChange >= 0 ? "↗️" : "↘️"}
                  {Math.abs(dashboardMetrics.monthlyCostChange).toFixed(1)}%
                  <span className="text-gray-500">전월 대비</span>
                </div>
              </div>

              {/* 작업량 */}
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {dashboardMetrics.monthlyWorkload}건
                </div>
                <div className="text-sm text-gray-600 mb-2">작업량</div>
                <div className={`text-xs font-medium flex items-center justify-center gap-1 ${
                  dashboardMetrics.monthlyWorkloadChange >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {dashboardMetrics.monthlyWorkloadChange >= 0 ? "↗️" : "↘️"}
                  {Math.abs(dashboardMetrics.monthlyWorkloadChange).toFixed(1)}%
                  <span className="text-gray-500">전월 대비</span>
                </div>
              </div>

              {/* 활용률 */}
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {dashboardMetrics.utilizationRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mb-2">활용률</div>
                <div className={`text-xs font-medium flex items-center justify-center gap-1 ${
                  dashboardMetrics.utilizationRateChange >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {dashboardMetrics.utilizationRateChange >= 0 ? "↗️" : "↘️"}
                  {Math.abs(dashboardMetrics.utilizationRateChange).toFixed(1)}%
                  <span className="text-gray-500">전월 대비</span>
                </div>
              </div>

              {/* 스크랩률 */}
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl mb-2">♻️</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {dashboardMetrics.scrapRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mb-2">스크랩률</div>
                <div className={`text-xs font-medium flex items-center justify-center gap-1 ${
                  dashboardMetrics.scrapRateChange <= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {dashboardMetrics.scrapRateChange <= 0 ? "↘️" : "↗️"}
                  {Math.abs(dashboardMetrics.scrapRateChange).toFixed(1)}%
                  <span className="text-gray-500">전월 대비</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                ⏰ 최근 계산 내역
                <Badge variant="secondary">{recentCalculations.length}건</Badge>
              </CardTitle>
              {recentCalculations.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllRecent(!showAllRecent)}
                >
                  {showAllRecent ? "접기" : "더보기"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentCalculations.length > 0 ? (
              <div className="space-y-3">
                {(showAllRecent ? recentCalculations : recentCalculations.slice(0, 3)).map((calc) => (
                  <div
                    key={calc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900 whitespace-nowrap truncate max-w-[20ch] block">{calc.productName}</span>
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex shrink-0">
                          {getMaterialDisplayName(calc.materialType)}
                        </Badge>
                        <span className="text-xs text-gray-500 hidden sm:inline shrink-0">
                          {formatDate(calc.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 hidden sm:block">
                        {calc.isPlate ? (
                          `${calc.plateThickness}×${calc.plateWidth}×${calc.plateLength}mm • ${calc.quantity}장`
                        ) : (
                          `${calc.shape === "rectangle" ? 
                            `${calc.width}×${calc.height}mm` : 
                            `⌀${calc.diameter}mm`} • ${calc.quantity}개 • ${calc.barsNeeded}봉`
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
                        {formatCurrency(calc.totalCost)}
                      </div>
                      <div className="text-xs text-gray-500 hidden sm:block">총 소재비</div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <Link to="/orders">
                    <Button variant="outline" className="w-full">
                      전체 계산 내역 보기 →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  첫 계산을 시작해보세요!
                </h3>
                <p className="text-gray-600 mb-6">
                  아직 계산 내역이 없습니다.<br />
                  봉비서로 CNC 재료 계산을 시작해보세요.
                </p>
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span>계산기로 이동하여 재료와 치수 입력</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span>계산 결과 확인 및 주문 저장</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>대시보드에서 통계 및 이력 확인</span>
                  </div>
                </div>
                <Link to="/calculator">
                  <Button className="mt-6" size="lg">
                    🔧 첫 계산 시작하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Section with Collapsible */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                📊 소재별 사용량 분석
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsChartExpanded(!isChartExpanded)}
              >
                {isChartExpanded ? "숨기기 ▲" : "자세히 ▼"}
              </Button>
            </div>
          </CardHeader>
          
          {/* Chart Content (Expandable) */}
          {isChartExpanded && (
            <CardContent>
              {materialUsageData.length > 0 ? (
                <div className="h-64 sm:h-80 overflow-x-auto">
                  <div className="min-w-[400px] h-full">
                    <ChartContainer
                      config={{
                        usage: {
                          label: "사용량 (kg)",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-full w-full"
                    >
                      <BarChart 
                        data={materialUsageData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="material"
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis tickLine={false} axisLine={false} className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="usage"
                          fill="var(--color-usage)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-center text-gray-500">
                  <div>
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>아직 소재 사용 데이터가 없습니다</p>
                    <p className="text-xs">계산기에서 주문을 저장하면 데이터가 표시됩니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          )}
          
          {/* Preview (Collapsed State) */}
          {!isChartExpanded && materialUsageData.length > 0 && (
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                {materialUsageData.slice(0, 3).map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="font-semibold text-sm">{item.material}</div>
                    <div className="text-xs text-gray-600">{item.usage}kg</div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
