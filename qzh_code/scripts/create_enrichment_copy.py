from __future__ import annotations

import argparse
import copy
import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data" / "hangzhou_food_recommendations.json"
DEFAULT_OUTPUT = ROOT / "data" / "hangzhou_food_recommendations_enriched.json"


def empty_provider(provider: str) -> dict:
    return {
        "provider": provider,
        "status": "not_queried",
        "query": None,
        "queried_at": None,
        "candidate_count": 0,
        "candidates": [],
        "error": None,
    }


def build_query(shop: dict, city: str) -> dict:
    address_hint = shop["address_hint"]
    name = shop["name"]
    if address_hint == "连锁":
        keyword = name
    else:
        keyword = f"{name} {address_hint}"

    return {
        "city": city,
        "keyword": keyword,
        "amap_keywords": keyword,
        "baidu_query": keyword,
        "notes": "优先用店名 + 原图地址/商圈检索；连锁店仅用店名，避免误匹配到随机门店。",
    }


def add_location_enrichment(payload: dict) -> dict:
    enriched = copy.deepcopy(payload)
    metadata = enriched["metadata"]
    metadata["derived_from"] = "data/hangzhou_food_recommendations.json"
    metadata["enrichment_created_at"] = datetime.now(timezone.utc).isoformat()
    metadata["geo_status"] = "enrichment_copy_pending"
    metadata["geo_notes"] = [
        "此文件是地理信息补全副本，原始抽取数据不在这里改写。",
        "高德坐标使用 GCJ-02；百度坐标使用 BD-09。",
        "selected_location 仅在脚本成功匹配 POI 后写入。",
    ]

    city = metadata["city"]
    for shop in enriched["shops"]:
        shop["location_query"] = build_query(shop, city)
        shop["location_enrichment"] = {
            "status": "pending",
            "selected_location": {
                "provider": None,
                "poi_id": None,
                "poi_name": None,
                "formatted_address": None,
                "longitude": None,
                "latitude": None,
                "coordinate_system": None,
                "confidence": None,
                "navigation_url": None,
            },
            "providers": {
                "amap": empty_provider("amap"),
                "baidu": empty_provider("baidu"),
            },
        }

    return enriched


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a safe enrichment copy for location data.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    payload = json.loads(args.source.read_text(encoding="utf-8"))
    enriched = add_location_enrichment(payload)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(enriched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
