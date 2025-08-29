import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResponsive } from "@/hooks/use-responsive";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Download, Filter, MoreHorizontal, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderToolbarProps {
  onSearch: (term: string) => void;
  onAdd: () => void;
  onExport: () => void;
  onFilter: () => void;
  onDelete: () => void;
  isDeleteMode: boolean;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export function OrderToolbar({ onSearch, onAdd, onExport, onFilter, onDelete, isDeleteMode, selectedCount, onDeleteSelected }: OrderToolbarProps) {
  const { isMobile } = useResponsive();

  const searchBar = (
    <div className={cn("relative flex-1", isMobile && "w-full")}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="주문 검색..."
        className="pl-8"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );

  const primaryActions = (
    <>
      {!isDeleteMode ? (
        <>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            신규 주문
          </Button>
          <Button variant="outline" onClick={onFilter}>
            <Filter className="h-4 w-4 mr-2" />
            필터
          </Button>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={onDelete}>
            <X className="h-4 w-4 mr-2" />
            취소
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            삭제 ({selectedCount})
          </Button>
        </>
      )}
    </>
  );

  const mobileOverflowMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          내보내기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const desktopActions = (
    <Button variant="outline" onClick={onExport}>
      <Download className="h-4 w-4 mr-2" />
      내보내기
    </Button>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {searchBar}
        <div className="flex items-center justify-between gap-2">
          {primaryActions}
          {mobileOverflowMenu}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {searchBar}
      <div className="flex items-center gap-2">
        {primaryActions}
        {desktopActions}
      </div>
    </div>
  );
}
