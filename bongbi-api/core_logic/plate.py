from .utils import parse_float_safe, kg_per_m3_to_g_per_cm3


def calculate_plate_weight(data):
    thickness_mm = parse_float_safe(data.get("plateThickness"))
    width_mm = parse_float_safe(data.get("plateWidth"))
    length_mm = parse_float_safe(data.get("plateLength"))
    quantity = parse_float_safe(data.get("quantity"))
    material_density_kg_per_m3 = parse_float_safe(data.get("materialDensity"))

    # Normalize density to g/cm³ for volume in cm³
    material_density_g_per_cm3 = kg_per_m3_to_g_per_cm3(material_density_kg_per_m3)

    volume_per_piece_mm3 = width_mm * length_mm * thickness_mm
    volume_per_piece_cm3 = volume_per_piece_mm3 / 1000.0
    weight_per_piece_g = volume_per_piece_cm3 * material_density_g_per_cm3
    weight_per_piece_kg = weight_per_piece_g / 1000.0
    total_weight = weight_per_piece_kg * quantity
    return total_weight if total_weight > 0 else 0.0


def calculate_plate_cost(data):
    total_weight = parse_float_safe(data.get("totalWeight"))
    plate_unit_price = parse_float_safe(data.get("plateUnitPrice"))
    total_cost = total_weight * plate_unit_price
    return total_cost if total_cost > 0 else 0.0


def calculate_unit_cost(data):
    total_cost = parse_float_safe(data.get("totalCost"))
    quantity = parse_float_safe(data.get("quantity"))
    if quantity <= 0:
        return 0.0
    unit_cost = total_cost / quantity
    return unit_cost if unit_cost > 0 else 0.0


def calculate_utilization_rate(_data):
    # Plates assume full utilization in current minimal model
    return 100.0


def calculate_wastage(_data):
    return 0.0


def calculate_scrap_savings(_data):
    # Scrap is calculated in scrap module; return 0 for plate path
    return 0.0


