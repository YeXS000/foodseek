from __future__ import annotations

import json
import sqlite3
import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "data" / "hangzhou_food_recommendations.json"
DB_PATH = ROOT / "data" / "hangzhou_food_recommendations.sqlite"


def selected_location(shop: dict) -> dict:
    enrichment = shop.get("location_enrichment") or {}
    selected = enrichment.get("selected_location") or {}
    return {
        "status": enrichment.get("status"),
        "provider": selected.get("provider"),
        "poi_id": selected.get("poi_id"),
        "poi_name": selected.get("poi_name"),
        "formatted_address": selected.get("formatted_address"),
        "longitude": selected.get("longitude"),
        "latitude": selected.get("latitude"),
        "coordinate_system": selected.get("coordinate_system"),
        "confidence": selected.get("confidence"),
        "navigation_url": selected.get("navigation_url"),
    }


def provider_candidates(shop: dict) -> list[tuple]:
    rows = []
    providers = (shop.get("location_enrichment") or {}).get("providers") or {}
    for provider_name, provider_payload in providers.items():
        for index, candidate in enumerate(provider_payload.get("candidates") or [], start=1):
            rows.append(
                (
                    shop["id"],
                    provider_name,
                    index,
                    candidate.get("poi_id"),
                    candidate.get("name"),
                    candidate.get("type"),
                    candidate.get("address"),
                    candidate.get("province"),
                    candidate.get("city"),
                    candidate.get("district"),
                    candidate.get("business_area"),
                    candidate.get("longitude"),
                    candidate.get("latitude"),
                    candidate.get("coordinate_system"),
                    candidate.get("confidence"),
                    candidate.get("navigation_url"),
                    json.dumps(candidate, ensure_ascii=False),
                )
            )
    return rows


def build_db(json_path: Path = JSON_PATH, db_path: Path = DB_PATH) -> None:
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    shops = payload["shops"]
    metadata = payload["metadata"]

    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(
            """
            DROP TABLE IF EXISTS poi_candidates;
            DROP TABLE IF EXISTS shop_dishes;
            DROP TABLE IF EXISTS shops;
            DROP TABLE IF EXISTS metadata;

            CREATE TABLE metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE shops (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                raw_name TEXT NOT NULL,
                recommended_dishes_json TEXT NOT NULL,
                address_hint TEXT NOT NULL,
                city TEXT NOT NULL,
                province TEXT NOT NULL,
                country TEXT NOT NULL,
                source_page INTEGER NOT NULL,
                status TEXT NOT NULL,
                geocode_status TEXT NOT NULL,
                geocode_provider TEXT,
                poi_name TEXT,
                formatted_address TEXT,
                longitude REAL,
                latitude REAL,
                location_enrichment_status TEXT,
                selected_provider TEXT,
                selected_poi_id TEXT,
                selected_poi_name TEXT,
                selected_formatted_address TEXT,
                selected_longitude REAL,
                selected_latitude REAL,
                selected_coordinate_system TEXT,
                selected_confidence REAL,
                selected_navigation_url TEXT,
                notes TEXT
            );

            CREATE TABLE shop_dishes (
                shop_id INTEGER NOT NULL,
                dish_order INTEGER NOT NULL,
                dish TEXT NOT NULL,
                PRIMARY KEY (shop_id, dish_order),
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
            );

            CREATE TABLE poi_candidates (
                shop_id INTEGER NOT NULL,
                provider TEXT NOT NULL,
                candidate_rank INTEGER NOT NULL,
                poi_id TEXT,
                name TEXT,
                type TEXT,
                address TEXT,
                province TEXT,
                city TEXT,
                district TEXT,
                business_area TEXT,
                longitude REAL,
                latitude REAL,
                coordinate_system TEXT,
                confidence REAL,
                navigation_url TEXT,
                raw_json TEXT NOT NULL,
                PRIMARY KEY (shop_id, provider, candidate_rank),
                FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
            );

            CREATE INDEX idx_shops_address_hint ON shops(address_hint);
            CREATE INDEX idx_shops_source_page ON shops(source_page);
            CREATE INDEX idx_shops_selected_provider ON shops(selected_provider);
            CREATE INDEX idx_shops_selected_confidence ON shops(selected_confidence);
            CREATE INDEX idx_shop_dishes_dish ON shop_dishes(dish);
            CREATE INDEX idx_poi_candidates_provider ON poi_candidates(provider);
            """
        )

        conn.executemany(
            "INSERT INTO metadata (key, value) VALUES (?, ?)",
            [(key, json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict)) else str(value)) for key, value in metadata.items()],
        )

        shop_rows = []
        dish_rows = []
        candidate_rows = []
        for shop in shops:
            geocode = shop["geocode"]
            selected = selected_location(shop)
            shop_rows.append(
                (
                    shop["id"],
                    shop["name"],
                    shop["raw_name"],
                    json.dumps(shop["recommended_dishes"], ensure_ascii=False),
                    shop["address_hint"],
                    metadata["city"],
                    metadata["province"],
                    metadata["country"],
                    shop["source_page"],
                    shop["status"],
                    geocode["status"],
                    geocode["provider"],
                    geocode["poi_name"],
                    geocode["formatted_address"],
                    geocode["longitude"],
                    geocode["latitude"],
                    selected["status"],
                    selected["provider"],
                    selected["poi_id"],
                    selected["poi_name"],
                    selected["formatted_address"],
                    selected["longitude"],
                    selected["latitude"],
                    selected["coordinate_system"],
                    selected["confidence"],
                    selected["navigation_url"],
                    shop["notes"],
                )
            )
            for index, dish in enumerate(shop["recommended_dishes"], start=1):
                dish_rows.append((shop["id"], index, dish))
            candidate_rows.extend(provider_candidates(shop))

        conn.executemany(
            """
            INSERT INTO shops (
                id,
                name,
                raw_name,
                recommended_dishes_json,
                address_hint,
                city,
                province,
                country,
                source_page,
                status,
                geocode_status,
                geocode_provider,
                poi_name,
                formatted_address,
                longitude,
                latitude,
                location_enrichment_status,
                selected_provider,
                selected_poi_id,
                selected_poi_name,
                selected_formatted_address,
                selected_longitude,
                selected_latitude,
                selected_coordinate_system,
                selected_confidence,
                selected_navigation_url,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            shop_rows,
        )
        conn.executemany(
            "INSERT INTO shop_dishes (shop_id, dish_order, dish) VALUES (?, ?, ?)",
            dish_rows,
        )
        conn.executemany(
            """
            INSERT INTO poi_candidates (
                shop_id,
                provider,
                candidate_rank,
                poi_id,
                name,
                type,
                address,
                province,
                city,
                district,
                business_area,
                longitude,
                latitude,
                coordinate_system,
                confidence,
                navigation_url,
                raw_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            candidate_rows,
        )

        actual_shop_count = conn.execute("SELECT COUNT(*) FROM shops").fetchone()[0]
        if actual_shop_count != 99:
            raise RuntimeError(f"Expected 99 shops, got {actual_shop_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build a SQLite database from food recommendations JSON.")
    parser.add_argument("--input", type=Path, default=JSON_PATH)
    parser.add_argument("--output", type=Path, default=DB_PATH)
    args = parser.parse_args()
    build_db(args.input, args.output)
    print(f"Built {args.output}")
