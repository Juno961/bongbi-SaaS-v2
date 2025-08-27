import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calculator,
  History,
  Settings,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const navigationItems = [
  {
    name: "대시보드",
    nameEn: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "자재 계산기",
    nameEn: "Material Calculator",
    href: "/calculator",
    icon: Calculator,
  },
  {
    name: "주문 내역",
    nameEn: "Order History",
    href: "/orders",
    icon: History,
  },
  {
    name: "설정",
    nameEn: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "도움말",
    nameEn: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="hidden lg:flex min-h-screen bg-white border-r border-gray-200 w-72">
      <div className="w-full p-6">
        <div className="space-y-3">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 h-14 rounded-xl font-medium group",
                    isActive
                      ? "bg-[#3182F6] text-white shadow-lg hover:bg-[#2563EB]"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-700",
                    )}
                  />
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {item.name}
                    </span>
                    <span className="text-xs opacity-70 whitespace-nowrap">
                      {item.nameEn}
                    </span>
                  </div>
                  {isActive && (
                    <div className="ml-auto">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
