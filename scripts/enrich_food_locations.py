from __future__ import annotations

import argparse
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "hangzhou_food_recommendations_enriched.json"
DEFAULT_OUTPUT = DEFAULT_INPUT

AMAP_ENDPOINT = "https://restapi.amap.com/v3/place/text"
BAIDU_ENDPOINT = "https://api.map.baidu.com/place/v2/search"
AMAP_FOOD_TYPES = "050000"
X_PI = math.pi * 3000.0 / 180.0
DEFAULT_MATCH_CONFIDENCE = 0.55
DEFAULT_REVIEW_CONFIDENCE = 0.35


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def http_get_json(endpoint: str, params: dict[str, Any]) -> dict[str, Any]:
    url = endpoint + "?" + urllib.parse.urlencode(params, doseq=True)
    request = urllib.request.Request(url, headers={"User-Agent": "foodseek-location-enricher/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def parse_lng_lat(location: str | None) -> tuple[float | None, float | None]:
    if not location or "," not in location:
        return None, None
    lng, lat = location.split(",", 1)
    return float(lng), float(lat)


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"[\s·.()（）\-_/、,，:：]+", "", value).lower()


def gcj02_to_bd09(lng: float, lat: float) -> tuple[float, float]:
    z = math.sqrt(lng * lng + lat * lat) + 0.00002 * math.sin(lat * X_PI)
    theta = math.atan2(lat, lng) + 0.000003 * math.cos(lng * X_PI)
    return z * math.cos(theta) + 0.0065, z * math.sin(theta) + 0.006


def bd09_to_gcj02(lng: float, lat: float) -> tuple[float, float]:
    x = lng - 0.0065
    y = lat - 0.006
    z = math.sqrt(x * x + y * y) - 0.00002 * math.sin(y * X_PI)
    theta = math.atan2(y, x) - 0.000003 * math.cos(x * X_PI)
    return z * math.cos(theta), z * math.sin(theta)


def score_candidate(shop: dict[str, Any], candidate: dict[str, Any]) -> float:
    score = 0.0
    name = str(candidate.get("name") or "")
    address = str(candidate.get("address") or "")
    district = str(candidate.get("district") or candidate.get("adname") or "")
    hint = shop["address_hint"]
    shop_name_normalized = normalize_text(shop["name"])
    candidate_name_normalized = normalize_text(name)

    if shop_name_normalized and shop_name_normalized in candidate_name_normalized:
        score += 0.55
    elif candidate_name_normalized and candidate_name_normalized in shop_name_normalized:
        score += 0.35
    elif shop_name_normalized and candidate_name_normalized:
        shared_chars = set(shop_name_normalized) & set(candidate_name_normalized)
        overlap = len(shared_chars) / max(len(set(shop_name_normalized)), 1)
        if overlap >= 0.7:
            score += 0.3
        elif overlap >= 0.5:
            score += 0.18

    if hint != "连锁":
        hint_blob = f"{address} {district} {candidate.get('business_area') or ''}"
        if hint in hint_blob:
            score += 0.35
    else:
        score += 0.1

    type_text = str(candidate.get("type") or "")
    if "餐饮" in type_text or "美食" in type_text or "中餐" in type_text or "小吃" in type_text:
        score += 0.1

    return min(score, 1.0)


def amap_navigation_url(lng: float, lat: float, name: str) -> str:
    params = urllib.parse.urlencode(
        {
            "position": f"{lng},{lat}",
            "name": name,
            "coordinate": "gaode",
            "callnative": "1",
        }
    )
    return f"https://uri.amap.com/marker?{params}"


def baidu_navigation_url(lng: float, lat: float, name: str, address: str | None) -> str:
    params = urllib.parse.urlencode(
        {
            "location": f"{lat},{lng}",
            "title": name,
            "content": address or name,
            "output": "html",
            "src": "foodseek",
        }
    )
    return f"https://api.map.baidu.com/marker?{params}"


def query_amap(shop: dict[str, Any], key: str, offset: int) -> dict[str, Any]:
    query = shop["location_query"]["amap_keywords"]
    params = {
        "key": key,
        "keywords": query,
        "city": shop["location_query"]["city"],
        "citylimit": "true",
        "types": AMAP_FOOD_TYPES,
        "extensions": "base",
        "offset": offset,
        "page": 1,
    }
    payload = http_get_json(AMAP_ENDPOINT, params)
    if payload.get("status") != "1":
        return {
            "provider": "amap",
            "status": "error",
            "query": query,
            "queried_at": now_iso(),
            "candidate_count": 0,
            "candidates": [],
            "error": payload.get("info") or "amap request failed",
        }

    candidates = []
    for poi in payload.get("pois", []):
        lng, lat = parse_lng_lat(poi.get("location"))
        if lng is None or lat is None:
            continue
        bd_lng, bd_lat = gcj02_to_bd09(lng, lat)
        candidate = {
            "provider": "amap",
            "poi_id": poi.get("id"),
            "name": poi.get("name"),
            "type": poi.get("type"),
            "typecode": poi.get("typecode"),
            "address": poi.get("address"),
            "province": poi.get("pname"),
            "city": poi.get("cityname"),
            "district": poi.get("adname"),
            "business_area": poi.get("business_area"),
            "longitude": lng,
            "latitude": lat,
            "coordinate_system": "GCJ-02",
            "bd09_longitude": bd_lng,
            "bd09_latitude": bd_lat,
            "navigation_url": amap_navigation_url(lng, lat, poi.get("name") or shop["name"]),
        }
        candidate["confidence"] = score_candidate(shop, candidate)
        candidates.append(candidate)

    candidates.sort(key=lambda item: item["confidence"], reverse=True)
    return {
        "provider": "amap",
        "status": "ok",
        "query": query,
        "queried_at": now_iso(),
        "candidate_count": len(candidates),
        "candidates": candidates,
        "error": None,
    }


def query_baidu(shop: dict[str, Any], key: str, offset: int) -> dict[str, Any]:
    query = shop["location_query"]["baidu_query"]
    params = {
        "ak": key,
        "query": query,
        "region": shop["location_query"]["city"],
        "city_limit": "true",
        "output": "json",
        "scope": 2,
        "page_size": offset,
        "page_num": 0,
    }
    payload = http_get_json(BAIDU_ENDPOINT, params)
    if payload.get("status") != 0:
        return {
            "provider": "baidu",
            "status": "error",
            "query": query,
            "queried_at": now_iso(),
            "candidate_count": 0,
            "candidates": [],
            "error": payload.get("message") or "baidu request failed",
        }

    candidates = []
    for poi in payload.get("results", []):
        location = poi.get("location") or {}
        lat = location.get("lat")
        lng = location.get("lng")
        if lng is None or lat is None:
            continue
        gcj_lng, gcj_lat = bd09_to_gcj02(float(lng), float(lat))
        candidate = {
            "provider": "baidu",
            "poi_id": poi.get("uid"),
            "name": poi.get("name"),
            "type": poi.get("detail_info", {}).get("tag"),
            "typecode": None,
            "address": poi.get("address"),
            "province": poi.get("province"),
            "city": poi.get("city"),
            "district": poi.get("area"),
            "business_area": poi.get("detail_info", {}).get("business_area"),
            "longitude": float(lng),
            "latitude": float(lat),
            "coordinate_system": "BD-09",
            "gcj02_longitude": gcj_lng,
            "gcj02_latitude": gcj_lat,
            "navigation_url": baidu_navigation_url(float(lng), float(lat), poi.get("name") or shop["name"], poi.get("address")),
        }
        candidate["confidence"] = score_candidate(shop, candidate)
        candidates.append(candidate)

    candidates.sort(key=lambda item: item["confidence"], reverse=True)
    return {
        "provider": "baidu",
        "status": "ok",
        "query": query,
        "queried_at": now_iso(),
        "candidate_count": len(candidates),
        "candidates": candidates,
        "error": None,
    }


def best_candidate(shop: dict[str, Any], preferred_provider: str) -> dict[str, Any] | None:
    providers = shop["location_enrichment"]["providers"]
    all_candidates = []
    for provider_name in ("amap", "baidu"):
        all_candidates.extend(providers.get(provider_name, {}).get("candidates") or [])

    if not all_candidates:
        return None

    if preferred_provider != "auto":
        preferred = [item for item in all_candidates if item["provider"] == preferred_provider]
        if preferred:
            return sorted(preferred, key=lambda item: item["confidence"], reverse=True)[0]

    return sorted(all_candidates, key=lambda item: item["confidence"], reverse=True)[0]


def apply_selected_location(shop: dict[str, Any], provider: str, match_confidence: float, review_confidence: float) -> None:
    candidate = best_candidate(shop, provider)
    if not candidate:
        shop["location_enrichment"]["status"] = "no_match"
        return

    confidence = candidate["confidence"]
    if confidence >= match_confidence:
        shop["location_enrichment"]["status"] = "matched"
    elif confidence >= review_confidence:
        shop["location_enrichment"]["status"] = "needs_review"
    else:
        shop["location_enrichment"]["status"] = "low_confidence"

    shop["location_enrichment"]["selected_location"] = {
        "provider": candidate["provider"],
        "poi_id": candidate["poi_id"],
        "poi_name": candidate["name"],
        "formatted_address": candidate["address"],
        "longitude": candidate["longitude"],
        "latitude": candidate["latitude"],
        "coordinate_system": candidate["coordinate_system"],
        "confidence": confidence,
        "navigation_url": candidate["navigation_url"],
    }


def enrich(payload: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    amap_key = os.environ.get("AMAP_WEB_SERVICE_KEY") or os.environ.get("AMAP_KEY")
    baidu_key = os.environ.get("BAIDU_MAP_AK") or os.environ.get("BAIDU_AK")
    use_amap = args.provider in {"amap", "both"} and bool(amap_key)
    use_baidu = args.provider in {"baidu", "both"} and bool(baidu_key)

    if args.provider in {"amap", "both"} and not amap_key:
        print("AMAP key not found; set AMAP_WEB_SERVICE_KEY to query AMap.")
    if args.provider in {"baidu", "both"} and not baidu_key:
        print("Baidu key not found; set BAIDU_MAP_AK to query Baidu Maps.")

    processed = 0
    for shop in payload["shops"]:
        if args.only_pending and shop["location_enrichment"]["status"] == "matched":
            continue
        if args.limit is not None and processed >= args.limit:
            break

        if use_amap:
            shop["location_enrichment"]["providers"]["amap"] = query_amap(shop, amap_key, args.offset)
            time.sleep(args.sleep)
        if use_baidu:
            shop["location_enrichment"]["providers"]["baidu"] = query_baidu(shop, baidu_key, args.offset)
            time.sleep(args.sleep)

        apply_selected_location(shop, args.select_provider, args.match_confidence, args.review_confidence)
        processed += 1

    payload["metadata"]["geo_status"] = "partially_enriched" if processed else payload["metadata"].get("geo_status", "enrichment_copy_pending")
    payload["metadata"]["last_location_enrichment_at"] = now_iso()
    payload["metadata"]["last_location_enrichment_count"] = processed
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich food shops with AMap/Baidu POI candidates.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--provider", choices=["amap", "baidu", "both"], default="both")
    parser.add_argument("--select-provider", choices=["auto", "amap", "baidu"], default="auto")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--offset", type=int, default=5)
    parser.add_argument("--sleep", type=float, default=0.2)
    parser.add_argument("--only-pending", action="store_true")
    parser.add_argument("--match-confidence", type=float, default=DEFAULT_MATCH_CONFIDENCE)
    parser.add_argument("--review-confidence", type=float, default=DEFAULT_REVIEW_CONFIDENCE)
    args = parser.parse_args()

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    enriched = enrich(payload, args)
    args.output.write_text(json.dumps(enriched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
