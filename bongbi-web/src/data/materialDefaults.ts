// Material defaults based on material_defaults_v1.0.csv
export interface MaterialDefaults {
  material: string;
  standard_bar_length: number; // mm
  material_density: number; // g/cm³
  bar_unit_price: number; // KRW/kg
  plate_unit_price: number; // KRW/kg
  scrap_unit_price: number; // KRW/kg
}

export const materialDefaults: Record<string, MaterialDefaults> = {
  brass: {
    material: "황동",
    standard_bar_length: 2500,
    material_density: 8.5,
    bar_unit_price: 8000,
    plate_unit_price: 8000, // Same as bar price by default
    scrap_unit_price: 6400, // 80% of bar price
  },
  steel: {
    material: "SUM24L/S45C",
    standard_bar_length: 2500,
    material_density: 7.85,
    bar_unit_price: 7000,
    plate_unit_price: 7000,
    scrap_unit_price: 5600,
  },
  stainless_303: {
    material: "SUS303",
    standard_bar_length: 3000,
    material_density: 7.93,
    bar_unit_price: 8500,
    plate_unit_price: 8500,
    scrap_unit_price: 6800,
  },
  stainless: {
    material: "SUS304",
    standard_bar_length: 2500,
    material_density: 7.93,
    bar_unit_price: 8500,
    plate_unit_price: 8500,
    scrap_unit_price: 6800,
  },
  stainless_316: {
    material: "SUS316",
    standard_bar_length: 2500,
    material_density: 7.98,
    bar_unit_price: 9000,
    plate_unit_price: 9000,
    scrap_unit_price: 7200,
  },
  aluminum: {
    material: "AL",
    standard_bar_length: 2500,
    material_density: 2.8,
    bar_unit_price: 4000,
    plate_unit_price: 4000,
    scrap_unit_price: 3200,
  },
};

// Helper function to get material defaults by key
export const getMaterialDefaults = (
  materialKey: string,
): MaterialDefaults | null => {
  // First check for custom material defaults from localStorage
  try {
    const customDefaults = localStorage.getItem("customMaterialDefaults");
    if (customDefaults) {
      const parsed = JSON.parse(customDefaults);
      if (parsed[materialKey]) {
        return parsed[materialKey];
      }
    }
  } catch (error) {
    console.error("Failed to load custom material defaults:", error);
  }
  
  // Fallback to built-in defaults
  return materialDefaults[materialKey] || null;
};

// Helper function to get display name
export const getMaterialDisplayName = (materialKey: string): string => {
  const defaults = getMaterialDefaults(materialKey);
  return defaults ? defaults.material : materialKey;
};

// Helper function to get all available materials (built-in + custom)
export const getAllMaterials = (): Record<string, MaterialDefaults> => {
  // Start with built-in materials
  const allMaterials = { ...materialDefaults };
  
  // Add custom materials from localStorage
  try {
    const customDefaults = localStorage.getItem("customMaterialDefaults");
    if (customDefaults) {
      const parsed = JSON.parse(customDefaults);
      Object.assign(allMaterials, parsed);
    }
  } catch (error) {
    console.error("Failed to load custom material defaults:", error);
  }
  
  return allMaterials;
};

// Helper function to get material keys for dropdown options
export const getMaterialKeys = (): string[] => {
  return Object.keys(getAllMaterials());
};

// Helper function to get appropriate price based on material type
export const getMaterialPrice = (
  materialKey: string,
  materialType: "rod" | "sheet",
  disablePlatePrice: boolean = false,
): number => {
  const defaults = getMaterialDefaults(materialKey);
  if (!defaults) return 0;

  if (materialType === "sheet") {
    return disablePlatePrice
      ? defaults.bar_unit_price
      : defaults.plate_unit_price;
  }
  return defaults.bar_unit_price;
};
