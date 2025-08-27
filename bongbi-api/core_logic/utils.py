def parse_float_safe(val):
    """
    안전하게 float 변환. 실패 시 0.0 반환.
    """
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def kg_per_m3_to_g_per_cm3(density_kg_per_m3: float) -> float:
    """
    Convert density from kg/m³ to g/cm³.
    1000 kg/m³ == 1 g/cm³
    """
    return density_kg_per_m3 / 1000.0
