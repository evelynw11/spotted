"""Download the CC-BY 4.0 Clothing Dataset for Second-Hand Fashion and build its local image index."""

import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request
import uuid

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT / "reference-data"
ARCHIVE_URL = "https://zenodo.org/api/records/8386668/files/circular_fashion_v1.tar.gz/content"
ARCHIVE_NAME = "circular_fashion_v1.tar.gz"
ID_NAMESPACE = uuid.UUID("6f1c2b0e-5a4d-4c55-9a51-2d3f0a7f9e11")
ITEM_FILE = re.compile(r"(?P<kind>labels|front)_(?P<stamp>\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2})\.(?:json|jpg)")
EMPTY = {"", "none", "no", "null", "n/a", "unknown", "not applicable", "not in the list"}
MAX_IMAGE_SIDE = 800
# Fix spelling variants in the dataset's labels.
LABEL_FIXES = {"Jacker": "Jacket", "ladys": "Ladies"}


def clean(value):
    """Return a trimmed string, or None for the dataset's various empty markers."""
    if not isinstance(value, str):
        return None
    value = " ".join(value.split())
    return None if value.lower() in EMPTY else value


def label(value):
    value = clean(value)
    return LABEL_FIXES.get(value, value)


def clean_list(values):
    if not isinstance(values, list):
        return []
    return [item for item in (clean(value) for value in values) if item]


def download_archive(destination):
    path = destination / ARCHIVE_NAME
    print(f"Downloading {ARCHIVE_NAME} from Zenodo (about 2.3 GB)…", flush=True)
    with urllib.request.urlopen(ARCHIVE_URL) as response, path.open("wb") as output:
        shutil.copyfileobj(response, output, length=1024 * 1024)
    return path


def extract_items(archive_path, staging):
    """Stream the archive once, keeping only each item's labels and front photo."""
    found = {}
    with tarfile.open(archive_path, "r|gz") as archive:
        for member in archive:
            match = ITEM_FILE.fullmatch(Path(member.name).name)
            if not member.isfile() or not match:
                continue
            key = f"{Path(member.name).parent.as_posix()}/{match['stamp']}"
            source = archive.extractfile(member)
            if source is None:
                continue
            if match["kind"] == "labels":
                try:
                    found.setdefault(key, {})["labels"] = json.load(source)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    print(f"Skipping unreadable labels: {member.name}", flush=True)
            else:
                target = staging / f"{uuid.uuid5(ID_NAMESPACE, key)}.jpg"
                with target.open("wb") as output:
                    shutil.copyfileobj(source, output)
                found.setdefault(key, {})["front"] = target
    return found


def build_catalog(found):
    images = ROOT / "images"
    images.mkdir(exist_ok=True)
    catalog = []
    for key, item in sorted(found.items()):
        labels, front = item.get("labels"), item.get("front")
        if not isinstance(labels, dict) or front is None:
            continue
        shutil.move(front, images / front.name)
        catalog.append({
            "id": front.stem,
            "category": label(labels.get("type")) or "Other",
            "department": label(labels.get("category")),
            "brand": clean(labels.get("brand")),
            "size": clean(labels.get("size")),
            "colors": list(dict.fromkeys(color.capitalize() for color in clean_list(labels.get("colors")))),
            "pattern": clean(labels.get("pattern")),
            "material": re.sub(r"%(?=\S)", "% ", clean(labels.get("material")) or "") or None,
            "price": clean(labels.get("price")),
        })
    if not catalog:
        raise ValueError("No items with both labels and a front photo were found in the archive.")
    return catalog


def prepare_images(directory):
    """Resize photos so the longest side is at most MAX_IMAGE_SIDE pixels, then stand them upright.

    The dataset's flat-lay photos show each garment lying sideways with the collar on the right,
    so a quarter turn counterclockwise (270 degrees clockwise in sips) puts the collar at the top.
    """
    files = sorted(str(path) for path in directory.glob("*.jpg"))
    for start in range(0, len(files), 500):
        subprocess.run(["sips", "-Z", str(MAX_IMAGE_SIDE), "-r", "270", *files[start:start + 500]],
                       check=True, stdout=subprocess.DEVNULL)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, help=f"Use an already downloaded {ARCHIVE_NAME}")
    options = parser.parse_args()
    ROOT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="spotted-dataset-", dir=ROOT) as temporary:
        temporary = Path(temporary)
        archive_path = options.archive or download_archive(temporary)
        staging = temporary / "staging"
        staging.mkdir()
        print("Extracting labels and front photos…", flush=True)
        found = extract_items(archive_path, staging)
        # Replace any previous dataset's photos with this one.
        shutil.rmtree(ROOT / "images", ignore_errors=True)
        catalog = build_catalog(found)
    print(f"Resizing and rotating {len(catalog):,} photos…", flush=True)
    prepare_images(ROOT / "images")
    (ROOT / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
    print(f"Imported {len(catalog):,} items. Building the local feature index…", flush=True)
    binary = ROOT / "reference-search"
    subprocess.run(["clang", "-O2", "-fobjc-arc", "-framework", "Foundation", "-framework", "Vision",
                    str(PROJECT / "scripts/reference-search.m"), "-o", str(binary)], check=True)
    subprocess.run([str(binary), "index", str(ROOT)], check=True)


if __name__ == "__main__":
    main()
