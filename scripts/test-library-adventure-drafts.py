#!/usr/bin/env python3
"""Check editorial draft against the established illustration and chapter contract."""
import json
from pathlib import Path

data = json.loads(Path("editorial/library-adventure-rewrites.en.json").read_text())
art = json.loads(Path("src/content/book-page-art.json").read_text())
expected = {"the-little-compass-and-the-money-choices": 8, "the-garden-everyone-could-enter": 6}
assert data["status"] == "editorial-draft-not-live"
assert len(data["books"]) == 2
for book in data["books"]:
    slug = book["slug"]
    assert slug in expected
    assert len(book["chapters"]) == expected[slug]
    for i, chapter in enumerate(book["chapters"]):
        assert chapter["sourceChapterIndex"] == i
        assert len(chapter["paragraphs"]) == 4, (slug, i)
        assert all(20 <= len(p.split()) <= 110 for p in chapter["paragraphs"]), (slug, i)
        assert f"{slug}:{i}:0" in art, (slug, i)
        assert chapter["title"] and all(p.strip() for p in chapter["paragraphs"])
assert len(set(b["slug"] for b in data["books"])) == 2
print("PASS: 14 original chapters, 56 story paragraphs, original artwork mapping preserved")
