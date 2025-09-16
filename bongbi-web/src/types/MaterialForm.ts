// 통일된 MaterialFormData 인터페이스
export interface MaterialFormData {
  productName: string;
  materialType: string;
  shape: string;
  diameter: string;
  width: string;
  height: string;
  productLength: string;
  cuttingLoss: string;
  headCut: string;
  tailCut: string;
  quantity: string;
  customer: string;
  productWeight: string;
  actualProductWeight: string;
  recoveryRatio: string;
  scrapUnitPrice: string;  // 통일된 필드명 (scrapPrice 제거)
  standardBarLength: string;
  materialDensity: string;
  materialPrice: string;
  plateThickness: string;
  plateWidth: string;
  plateLength: string;
  plateUnitPrice: string;
}
