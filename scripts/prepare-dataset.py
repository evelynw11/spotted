"""Import the publisher's complete CC0 dataset and build its local image index."""

import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT / "reference-data"
SOURCE = "https://codeload.github.com/alexeygrigorev/clothing-dataset/zip/refs/heads/master"
BASE_PRICES = {
    "T-Shirt": 18, "Longsleeve": 24, "Pants": 44, "Shoes": 55, "Shirt": 30,
    "Dress": 48, "Outwear": 64, "Shorts": 24, "Hat": 16, "Skirt": 34,
    "Polo": 26, "Undershirt": 12, "Blazer": 65, "Hoodie": 38, "Body": 20,
    "Top": 22, "Blouse": 32,
}


def import_catalog(archive_path):
    with zipfile.ZipFile(archive_path) as archive:
        manifest, = (name for name in archive.namelist() if name.endswith("/images.csv"))
        prefix = manifest.removesuffix("images.csv")
        with archive.open(manifest) as source:
            rows = {row["image"]: row for row in csv.DictReader(io.TextIOWrapper(source, encoding="utf-8-sig"))}
        if not rows:
            raise ValueError("The dataset manifest is empty.")
        catalog = []
        images = ROOT / "images"
        images.mkdir(exist_ok=True)
        photo_prefix = f"{prefix}images/"
        for member in sorted(archive.namelist()):
            if not member.startswith(photo_prefix):
                continue
            name = member.removeprefix(photo_prefix)
            if not re.fullmatch(r"[a-f0-9-]{36}\.jpg", name):
                continue
            image_id = name.removesuffix(".jpg")
            row = rows.get(image_id, {})
            category = row.get("label", "Not sure")
            seed = hashlib.sha256(image_id.encode()).digest()
            with archive.open(member) as source, (images / name).open("wb") as output:
                shutil.copyfileobj(source, output)
            catalog.append({
                "id": image_id,
                "category": category,
                "audience": {"true": "Kids", "false": "General"}.get(row.get("kids", "").lower(), "Unknown"),
                "price": BASE_PRICES.get(category, 25) + seed[0] % 15,
                "condition": ("New", "Like new", "Good")[seed[1] % 3],
            })
    if not catalog:
        raise ValueError("No reference photos found in the archive.")
    missing = rows.keys() - {entry["id"] for entry in catalog}
    if missing:
        print(f"{len(missing)} metadata rows refer to photos absent from the publisher archive.", flush=True)
    return catalog


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, help="Use an already downloaded publisher ZIP")
    options = parser.parse_args()
    ROOT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="spotted-dataset-") as temporary:
        archive_path = options.zip
        if archive_path is None:
            archive_path = Path(temporary) / "dataset.zip"
            print("Downloading the full reference dataset…", flush=True)
            urllib.request.urlretrieve(SOURCE, archive_path)
        catalog = import_catalog(archive_path)
    (ROOT / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
    print(f"Imported {len(catalog):,} reference photos. Building the local feature index…", flush=True)
    binary = ROOT / "reference-search"
    subprocess.run(["clang", "-O2", "-fobjc-arc", "-framework", "Foundation", "-framework", "Vision",
                    str(PROJECT / "scripts/reference-search.m"), "-o", str(binary)], check=True)
    subprocess.run([str(binary), "index", str(ROOT)], check=True)


if __name__ == "__main__":
    main()
