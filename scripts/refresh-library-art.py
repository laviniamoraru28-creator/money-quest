"""Build the compact reader mapping from reviewed generation receipts.

Keep generated pixels intact: resizing preserves aspect ratio. Never publish a
mapping to an absent file. Source text stays in the review inventory, outside
the client bundle.
"""
from pathlib import Path
import hashlib
import json
from io import BytesIO
from PIL import Image

root = Path(__file__).resolve().parents[1]
inventory_path = root / "docs/library-illustration-inventory.json"
inventory = json.loads(inventory_path.read_text())
receipts = {}
batch = root / ".work/generated-receipts.json"
if batch.exists():
    for row in json.loads(batch.read_text()):
        receipts[row["image"]] = row
for path in sorted((root / ".work/page-receipts").glob("*.json")):
    row = json.loads(path.read_text())
    receipts[row["image"]] = row

mapping = {}
for row in inventory:
    destination = root / "public" / row["image"].lstrip("/")
    receipt = receipts.get(row["image"])
    if receipt and Path(receipt["source"]).exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        image = Image.open(receipt["source"]).convert("RGB")
        image.thumbnail((960, 960))
        encoded = BytesIO()
        image.save(encoded, format="WEBP", quality=85)
        temporary = destination.with_suffix(".webp.tmp")
        temporary.write_bytes(encoded.getvalue())
        temporary.replace(destination)
    if not destination.exists():
        continue
    with Image.open(destination) as image:
        width, height = image.size
    digest = hashlib.sha256(row["text"].encode()).hexdigest()
    row.update(status="generated-awaiting-visual-review", sha256=hashlib.sha256(destination.read_bytes()).hexdigest(), sourceHash=digest)
    mapping[f'{row["book"]}:{row["chapter"]}:{row["part"]}'] = {
        "src": row["image"], "width": width, "height": height, "sourceHash": digest
    }

(root / "src/content/book-page-art.json").write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n")
inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n")
print(f"Mapped {len(mapping)}/{len(inventory)} individual original-book pages.")
