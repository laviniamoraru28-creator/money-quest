"""Public hosting for finished videos (Buffer fetches media from a URL).

Uses a GitHub Release on this repository (public), so it's free and needs no
new account. Each video gets its own pre-release `tiktok-<run>`, and its
download URL stays valid until the release is deleted. Old releases are
cleaned up once the post has been published for a while.

Runs inside GitHub Actions, where the `gh` CLI is authenticated with the
workflow's GITHUB_TOKEN.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
import urllib.request
from pathlib import Path


def _repo() -> str:
    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        raise RuntimeError("GITHUB_REPOSITORY not set: hosting runs in GitHub Actions")
    return repo


def tag_for(run: str) -> str:
    return f"tiktok-{run}"


def upload(run: str, out_dir: Path) -> str:
    repo, tag = _repo(), tag_for(run)
    video = out_dir / "video.mp4"
    exists = subprocess.run(["gh", "release", "view", tag, "--repo", repo], capture_output=True).returncode == 0
    if not exists:
        subprocess.run(["gh", "release", "create", tag, "--repo", repo, "--prerelease",
                        "--title", f"TikTok video {run}",
                        "--notes", "Hosting for a scheduled Money Quest TikTok video (tiktok-studio). Safe to delete after it is published.",
                        str(video)], check=True)
    else:
        subprocess.run(["gh", "release", "upload", tag, str(video), "--repo", repo, "--clobber"], check=True)
    return f"https://github.com/{repo}/releases/download/{tag}/video.mp4"


def check_public(url: str, expected_size: int | None = None) -> dict:
    """Anonymous fetch of the first bytes, following redirects, like Buffer would."""
    req = urllib.request.Request(url, headers={"Range": "bytes=0-1023", "User-Agent": "media-check"})
    with urllib.request.urlopen(req, timeout=60) as r:
        head = r.read(1024)
        info = {"status": r.status, "final_url": r.geturl().split("?")[0], "content_type": r.headers.get("Content-Type"),
                "content_range": r.headers.get("Content-Range")}
    info["looks_like_mp4"] = b"ftyp" in head[:16]
    if expected_size and info.get("content_range"):
        info["size_ok"] = info["content_range"].endswith(f"/{expected_size}")
    return info


def cleanup(published_runs: list[str], keep_days: int = 14) -> list[str]:
    """Delete hosting releases for videos that TikTok has had for keep_days."""
    repo = _repo()
    out = subprocess.run(["gh", "release", "list", "--repo", repo, "--limit", "200", "--json", "tagName,createdAt"],
                         capture_output=True, text=True, check=True)
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=keep_days)
    deleted = []
    for rel in json.loads(out.stdout):
        tag = rel["tagName"]
        if not tag.startswith("tiktok-") or tag[len("tiktok-"):] not in published_runs:
            continue
        created = dt.datetime.fromisoformat(rel["createdAt"].replace("Z", "+00:00"))
        if created < cutoff:
            subprocess.run(["gh", "release", "delete", tag, "--repo", repo, "--yes", "--cleanup-tag"], check=True)
            deleted.append(tag)
    return deleted
