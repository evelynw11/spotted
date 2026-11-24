"""Download Kaggle's full-resolution CC0 clothing dataset and build its local image index."""

import argparse
import csv
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT / "reference-data"
DATASET = "agrigorev/clothing-dataset-full"


def download_archive(destination):
    if shutil.which("kaggle") is None:
        raise RuntimeError("Kaggle CLI is missing. Install the project requirements first.")
    try:
        subprocess.run(
            ["kaggle", "datasets", "download", DATASET, "--path", str(destination)],
            check=True,
        )
    except FileNotFoundError as error:
        raise RuntimeError("Kaggle CLI is missing. Install the project requirements first.") from error
    archives = list(destination.glob("*.zip"))
    if len(archives) != 1:
        raise RuntimeError(f"Expected one Kaggle dataset archive, found {len(archives)}.")
    return archives[0]


def import_catalog(archive_path):
    with zipfile.ZipFile(archive_path) as archive:
        manifests = [name for name in archive.namelist() if name == "images.csv" or name.endswith("/images.csv")]
        if len(manifests) != 1:
            raise ValueError(f"Expected one images.csv manifest, found {len(manifests)}.")
        manifest, = manifests
        prefix = manifest.removesuffix("images.csv")
        with archive.open(manifest) as source:
            rows = {row["image"]: row for row in csv.DictReader(io.TextIOWrapper(source, encoding="utf-8-sig"))}
        if not rows:
            raise ValueError("The dataset manifest is empty.")
        photo_prefix = f"{prefix}images/"
        image_members = [
            member for member in sorted(archive.namelist())
            if member.startswith(photo_prefix) and re.fullmatch(r"[a-f0-9-]{36}\.jpg", member.removeprefix(photo_prefix))
        ]
        if not image_members:
            raise ValueError("The Kaggle archive does not contain the full-resolution images/ directory.")
        catalog = []
        images = ROOT / "images"
        images.mkdir(exist_ok=True)
        for member in image_members:
            name = member.removeprefix(photo_prefix)
            image_id = name.removesuffix(".jpg")
            row = rows.get(image_id, {})
            category = row.get("label", "Not sure")
            with archive.open(member) as source, (images / name).open("wb") as output:
                shutil.copyfileobj(source, output)
            catalog.append({"id": image_id, "category": category})
    if not catalog:
        raise ValueError("No reference photos found in the archive.")
    missing = rows.keys() - {entry["id"] for entry in catalog}
    if missing:
        print(f"{len(missing)} metadata rows refer to photos absent from the Kaggle archive.", flush=True)
    return catalog


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, help="Use an already downloaded Kaggle dataset ZIP")
    options = parser.parse_args()
    ROOT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="spotted-dataset-") as temporary:
        archive_path = options.zip
        if archive_path is None:
            print(f"Downloading Kaggle dataset {DATASET} (about 7 GB)…", flush=True)
            archive_path = download_archive(Path(temporary))
        catalog = import_catalog(archive_path)
    (ROOT / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
    print(f"Imported {len(catalog):,} reference photos. Building the local feature index…", flush=True)
    binary = ROOT / "reference-search"
    subprocess.run(["clang", "-O2", "-fobjc-arc", "-framework", "Foundation", "-framework", "Vision",
                    str(PROJECT / "scripts/reference-search.m"), "-o", str(binary)], check=True)
    subprocess.run([str(binary), "index", str(ROOT)], check=True)
    retained_images = {f"{entry['id']}.jpg" for entry in catalog}
    for image in (ROOT / "images").glob("*.jpg"):
        if image.name not in retained_images:
            image.unlink()


if __name__ == "__main__":
    main()
