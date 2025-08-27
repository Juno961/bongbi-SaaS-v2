import { getMaterialDefaults } from "@/data/materialDefaults";

export interface RodCalculationInput {
  shape: string;
  diameter: number;
  width?: number;
  height?: number;
  productLength: number;
  quantity: number;
  cuttingLoss: number;
  headCut: number;
  tailCut: number;
  standardBarLength: number;
  materialDensity: number;
  materialPrice: number;
  recoveryRatio: number;
  productWeight?: number; // 제품 1개 중량 (g) - 계산된 값
  actualProductWeight?: number; // 제품 실 중량 (g) - 사용자 입력값
  scrapUnitPrice?: number; // 스크랩 단가 (₩/kg)
}

export interface PlateCalculationInput {
  thickness: number;
  width: number;
  length: number;
  quantity: number;
  materialDensity: number;
  plateUnitPrice: number;
}

export interface CalculationResult {
  totalBarsNeeded: number;
  standardBarLength: number;
  materialCost: number;
  utilizationRate: number;
  scrapSavings: number;
  wastage: number;
  costPerPiece: number;
  totalWeight: number;
  scrapWeight?: number;
  realCost?: number;
}

/**
 * Calculate cross-sectional area for different rod shapes
 */
export const calculateCrossSectionalArea = (
  shape: string,
  diameter: number,
  width?: number,
  height?: number
): number => {
  switch (shape) {
    case "circle":
      return Math.PI * Math.pow(diameter / 2, 2);
    case "square":
      return diameter * diameter;
    case "hexagon":
      return ((3 * Math.sqrt(3)) / 2) * Math.pow(diameter / 2, 2);
    case "rectangle":
      if (!width || !height) throw new Error("Width and height required for rectangle");
      return width * height;
    default:
      return Math.PI * Math.pow(diameter / 2, 2); // Default to circle
  }
};

/**
 * Calculate rod material requirements
 */
export const calculateRodMaterial = (input: RodCalculationInput): CalculationResult => {
  const {
    shape,
    diameter,
    width,
    height,
    productLength,
    quantity,
    cuttingLoss,
    headCut,
    tailCut,
    standardBarLength,
    materialDensity,
    materialPrice,
    recoveryRatio,
    productWeight,
    actualProductWeight,
    scrapUnitPrice,
  } = input;

  // Calculate cross-sectional area (mm²)
  const area = calculateCrossSectionalArea(shape, diameter, width, height);

  // Calculate unit length per piece (product length + cutting loss)
  const unitLength = productLength + cuttingLoss;

  // Calculate usable bar length (standard bar length - head cut - tail cut)
  const usableBarLength = standardBarLength - headCut - tailCut;

  // Calculate how many pieces can be cut from one usable bar
  const piecesPerBar = Math.floor(usableBarLength / unitLength);

  // Calculate total bars needed
  const totalBarsNeeded = Math.ceil(quantity / piecesPerBar);

  // Calculate material utilization
  const usedLength = quantity * unitLength;
  const totalUsableLength = totalBarsNeeded * usableBarLength;
  const utilizationRate = (usedLength / totalUsableLength) * 100;

  // Calculate wastage
  const wastage = 100 - utilizationRate;

  // Calculate volume and weight
  // Volume = Area (mm²) × Length (mm) = mm³
  // Convert to cm³: mm³ / 1000 = cm³
  // Weight = Volume (cm³) × Density (g/cm³) = g
  // Convert to kg: g / 1000 = kg
  const totalVolumeInMm3 = area * (totalBarsNeeded * standardBarLength); // mm³
  const totalVolumeInCm3 = totalVolumeInMm3 / 1000; // cm³
  const totalWeight = (totalVolumeInCm3 * materialDensity) / 1000; // kg

  // Calculate costs
  const materialCost = totalWeight * materialPrice;
  const costPerPiece = materialCost / quantity;

  // Scrap calculation logic - only calculate when proper conditions are met
  let scrapWeight = undefined;
  let scrapSavings = 0;
  let realCost = undefined;

  // Only calculate scrap if ALL required conditions are met:
  // 1. Actual product weight is provided and > 0
  // 2. Scrap unit price is provided and > 0
  // 3. Recovery ratio is provided and > 0
  if (actualProductWeight && actualProductWeight > 0 && scrapUnitPrice && scrapUnitPrice > 0 && recoveryRatio && recoveryRatio > 0) {
    // 총제품실중량(kg) = 사용자가 입력한 제품 실 중량(g) × 수량 ÷ 1000
    const totalActualProductWeight = (actualProductWeight * quantity) / 1000; // kg

    // 스크랩중량(kg) = 총중량 - 총제품실중량
    scrapWeight = Math.max(0, totalWeight - totalActualProductWeight);

    // 스크랩절약액(₩) = 스크랩중량 × 스크랩단가 × 스크랩환산비율
    scrapSavings = scrapWeight * scrapUnitPrice * (recoveryRatio / 100);

    // 실제재료비(₩) = 총재료비 - 스크랩절약액
    realCost = materialCost - scrapSavings;
  }

  return {
    totalBarsNeeded,
    standardBarLength,
    materialCost,
    utilizationRate,
    scrapSavings,
    wastage,
    costPerPiece,
    totalWeight,
    scrapWeight,
    realCost,
  };
};

/**
 * Calculate plate material requirements
 */
export const calculatePlateMaterial = (input: PlateCalculationInput): CalculationResult => {
  const { thickness, width, length, quantity, materialDensity, plateUnitPrice } = input;

  // Calculate volume and weight for plates
  // Volume = Width (mm) × Length (mm) × Thickness (mm) = mm³
  // Convert to cm³: mm³ / 1000 = cm³
  // Weight = Volume (cm³) × Density (g/cm³) = g
  // Convert to kg: g / 1000 = kg
  const volumePerPieceInMm3 = width * length * thickness; // mm³
  const volumePerPieceInCm3 = volumePerPieceInMm3 / 1000; // cm³
  const weightPerPiece = (volumePerPieceInCm3 * materialDensity) / 1000; // kg
  const totalWeight = weightPerPiece * quantity; // kg

  // Calculate costs
  const materialCost = totalWeight * plateUnitPrice;
  const costPerPiece = materialCost / quantity;

  return {
    totalBarsNeeded: quantity, // For plates, this represents piece count
    standardBarLength: 0, // Not applicable for plates
    materialCost,
    utilizationRate: 100, // Plates have 100% utilization
    scrapSavings: 0,
    wastage: 0,
    costPerPiece,
    totalWeight,
  };
};

/**
 * Get material defaults with fallback values
 */
export const getMaterialProperties = (materialType: string) => {
  const defaults = getMaterialDefaults(materialType);

  return {
    standardBarLength: defaults?.standard_bar_length || 2500,
    materialDensity: defaults?.material_density || 7.85,
    barUnitPrice: defaults?.bar_unit_price || 7000,
    plateUnitPrice: defaults?.plate_unit_price || 7000,
    scrapUnitPrice: defaults?.scrap_unit_price || 5600,
  };
};
