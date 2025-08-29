import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Circle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderCardProps {
  order: {
    id: string;
    title: string;
    status: string;
    material: string;
    quantity: number;
    createdAt: string;
  };
  onViewDetails: (id: string) => void;
  onMoreActions: (id: string) => void;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onSelectForDelete?: (id: string) => void;
}

export function OrderCard({ order, onViewDetails, onMoreActions, isDeleteMode = false, isSelected = false, onSelectForDelete }: OrderCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDeleteMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSelectForDelete?.(order.id)}
                className="h-8 w-8"
              >
                {isSelected ? (
                  <CheckCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            )}
            <CardTitle className="text-base line-clamp-1">{order.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
              {order.status === 'completed' ? '완료' : order.status === 'pending' ? '대기' : '임시'}
            </Badge>
            {!isDeleteMode && (
              <Button variant="ghost" size="icon" onClick={() => onMoreActions(order.id)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">소재:</span>
            <span className="font-medium">{order.material}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">수량:</span>
            <span className="font-medium">{order.quantity}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">등록일:</span>
            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          {!isDeleteMode && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => onViewDetails(order.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              상세 보기
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
