import { useResponsive } from "@/hooks/use-responsive";
import { OrderCard } from "./OrderCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Circle, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  title: string;
  status: string;
  material: string;
  quantity: number;
  createdAt: string;
}

interface OrderListProps {
  orders: Order[];
  onViewDetails: (id: string) => void;
  onMoreActions: (id: string) => void;
  isDeleteMode?: boolean;
  selectedForDelete?: string[];
  onSelectForDelete?: (id: string) => void;
}

export function OrderList({ orders, onViewDetails, onMoreActions, isDeleteMode = false, selectedForDelete = [], onSelectForDelete }: OrderListProps) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={onViewDetails}
            onMoreActions={onMoreActions}
            isDeleteMode={isDeleteMode}
            isSelected={selectedForDelete.includes(order.id)}
            onSelectForDelete={onSelectForDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {isDeleteMode && <TableHead className="w-[50px]">선택</TableHead>}
            <TableHead className="min-w-[200px]">제목</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>소재</TableHead>
            <TableHead className="text-right">수량</TableHead>
            <TableHead>등록일</TableHead>
            <TableHead className="w-[100px]">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              {isDeleteMode && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSelectForDelete?.(order.id)}
                    className="h-8 w-8"
                  >
                    {selectedForDelete.includes(order.id) ? (
                      <CheckCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
              )}
              <TableCell className="font-medium">{order.title}</TableCell>
              <TableCell>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                  {order.status === 'completed' ? '완료' : order.status === 'pending' ? '대기' : '임시'}
                </Badge>
              </TableCell>
              <TableCell>{order.material}</TableCell>
              <TableCell className="text-right">{order.quantity}개</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onViewDetails(order.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onMoreActions(order.id)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
