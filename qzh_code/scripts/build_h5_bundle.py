from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP_DIR = ROOT / "app"
DIST_DIR = ROOT / "dist" / "foodseek"


def run_export() -> None:
    subprocess.run([sys.executable, str(ROOT / "scripts" / "export_h5_data.py")], check=True)


def copy_app(output: Path) -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)

    for item in APP_DIR.iterdir():
        if item.is_file():
            shutil.copy2(item, output / item.name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the static H5 bundle for deployment.")
    parser.add_argument("--output", type=Path, default=DIST_DIR)
    args = parser.parse_args()

    run_export()
    copy_app(args.output)
    print(f"Built {args.output}")


if __name__ == "__main__":
    main()
