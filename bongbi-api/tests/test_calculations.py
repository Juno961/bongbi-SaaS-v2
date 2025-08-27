import math

from core_logic.rod import (
    calculate_bars_needed,
    calculate_total_weight,
    calculate_utilization_rate,
    calculate_total_cost,
)
from core_logic.plate import (
    calculate_plate_weight,
    calculate_plate_cost,
    calculate_unit_cost as plate_unit_cost,
)
from core_logic.scrap import calculate_scrap_metrics


def test_rod_basic_and_edge_cases():
    data = {
        "shape": "circle",
        "diameter": 20,
        "productLength": 30,
        "quantity": 100,
        "cuttingLoss": 2,
        "headCut": 20,
        "tailCut": 250,
        "standardBarLength": 2500,
        "materialDensity": 7850,  # kg/m³
        "materialPrice": 7000,
    }

    bars = calculate_bars_needed(data)
    assert bars >= 1

    data["barsNeeded"] = bars
    total_weight = calculate_total_weight(data)
    assert total_weight > 0

    util = calculate_utilization_rate(data)
    assert 0 <= util <= 100

    data["totalWeight"] = total_weight
    total_cost = calculate_total_cost(data)
    assert total_cost >= 0

    # Edge: unusable bar
    data_edge = dict(data)
    data_edge.update({"standardBarLength": 10})
    data_edge["barsNeeded"] = calculate_bars_needed(data_edge)
    util_edge = calculate_utilization_rate(data_edge)
    assert util_edge == 0


def test_plate_basic():
    data = {
        "plateThickness": 10,
        "plateWidth": 100,
        "plateLength": 200,
        "quantity": 50,
        "materialDensity": 7850,  # kg/m³
        "plateUnitPrice": 7000,
    }
    total_weight = calculate_plate_weight(data)
    assert total_weight > 0
    data["totalWeight"] = total_weight
    total_cost = calculate_plate_cost(data)
    assert total_cost == total_weight * data["plateUnitPrice"]
    unit_cost = plate_unit_cost({"totalCost": total_cost, "quantity": data["quantity"]})
    assert unit_cost == total_cost / data["quantity"]


def test_scrap_calculation():
    base = {
        "totalWeight": 100.0,  # kg
        "totalCost": 1000000.0,
        "quantity": 100,
        "actualProductWeight": 800.0,  # g
        "recoveryRatio": 90.0,  # %
        "scrapUnitPrice": 5600.0,  # ₩/kg
    }
    scrap = calculate_scrap_metrics(base)
    assert scrap["scrapWeight"] >= 0
    assert scrap["realCost"] <= base["totalCost"]
    assert scrap["unitCost"] == scrap["realCost"] / base["quantity"]

    # Edge: missing preconditions should bypass savings
    no_scrap = calculate_scrap_metrics({**base, "recoveryRatio": 0})
    assert no_scrap["scrapSavings"] == 0
    assert no_scrap["realCost"] == base["totalCost"]


