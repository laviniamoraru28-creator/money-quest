"""Minimal client for TikTok's official Content Posting API and Display API.

Uses only the documented, authorised endpoints (OAuth 2.0 user tokens):
  * Content Posting API  - video.publish (direct post) / video.upload (send to drafts inbox)
  * Display API          - video.list (performance metrics for our own videos)

Credentials come from environment variables, never from files in the repo:
  TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REFRESH_TOKEN
  TIKTOK_REDIRECT_URI (only for the one-time authorisation step)

Important platform rule: until TikTok audits the developer app, direct posts
are restricted to private visibility (SELF_ONLY). Sending to the drafts inbox
works without an audit; the creator then finishes posting inside the app.
"""
from __future__ import annotations

import json
import os
import secrets
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://open.tiktokapis.com"
AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
SCOPES = "user.info.basic,video.upload,video.publish,video.list"


class TikTokError(RuntimeError):
    pass


def _env(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        raise TikTokError(f"Missing environment variable {name}")
    return v


def _request(method: str, url: str, *, token: str | None = None, json_body=None, form=None, data: bytes | None = None, headers=None, timeout=120):
    hdrs = dict(headers or {})
    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode()
        hdrs["Content-Type"] = "application/json; charset=UTF-8"
    elif form is not None:
        body = urllib.parse.urlencode(form).encode()
        hdrs["Content-Type"] = "application/x-www-form-urlencoded"
    elif data is not None:
        body = data
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, method=method, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:  # surface TikTok's error JSON
        raw = e.read()
        try:
            payload = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            payload = {"raw": raw[:300].decode(errors="replace")}
        raise TikTokError(f"HTTP {e.code} from {url}: {payload}") from None
    if not raw:
        return {}
    payload = json.loads(raw)
    err = payload.get("error")
    if isinstance(err, dict) and err.get("code") not in (None, "ok"):
        raise TikTokError(f"{url}: {err}")
    return payload


# -- OAuth ------------------------------------------------------------------
def authorize_url() -> tuple[str, str]:
    state = secrets.token_urlsafe(16)
    q = {
        "client_key": _env("TIKTOK_CLIENT_KEY"),
        "scope": SCOPES,
        "response_type": "code",
        "redirect_uri": _env("TIKTOK_REDIRECT_URI"),
        "state": state,
    }
    return AUTH_URL + "?" + urllib.parse.urlencode(q), state


def exchange_code(code: str) -> dict:
    return _request("POST", f"{API}/v2/oauth/token/", form={
        "client_key": _env("TIKTOK_CLIENT_KEY"),
        "client_secret": _env("TIKTOK_CLIENT_SECRET"),
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": _env("TIKTOK_REDIRECT_URI"),
    })


def access_token() -> str:
    tok = _request("POST", f"{API}/v2/oauth/token/", form={
        "client_key": _env("TIKTOK_CLIENT_KEY"),
        "client_secret": _env("TIKTOK_CLIENT_SECRET"),
        "grant_type": "refresh_token",
        "refresh_token": _env("TIKTOK_REFRESH_TOKEN"),
    })
    if tok.get("refresh_token") and tok["refresh_token"] != os.environ.get("TIKTOK_REFRESH_TOKEN"):
        # Do not print the token. Flag it so the operator can rotate the secret.
        print("::warning::TikTok issued a new refresh token. Re-run `python -m studio auth` and update the TIKTOK_REFRESH_TOKEN secret before the old one expires.")
    if "access_token" not in tok:
        raise TikTokError(f"token refresh failed: {tok.get('error_description') or tok}")
    return tok["access_token"]


# -- Posting ----------------------------------------------------------------
def creator_info(token: str) -> dict:
    return _request("POST", f"{API}/v2/post/publish/creator_info/query/", token=token, json_body={})["data"]


def _upload(upload_url: str, video: Path) -> None:
    size = video.stat().st_size
    _request("PUT", upload_url, data=video.read_bytes(), headers={
        "Content-Type": "video/mp4",
        "Content-Length": str(size),
        "Content-Range": f"bytes 0-{size - 1}/{size}",
    }, timeout=600)


def _source_info(video: Path) -> dict:
    size = video.stat().st_size
    if size > 64 * 1024 * 1024:
        raise TikTokError("video larger than 64 MB; chunked upload not implemented (our videos are ~5 MB)")
    return {"source": "FILE_UPLOAD", "video_size": size, "chunk_size": size, "total_chunk_count": 1}


def send_to_drafts(token: str, video: Path) -> str:
    """Uploads to the creator's TikTok inbox; they finish and post in the app."""
    res = _request("POST", f"{API}/v2/post/publish/inbox/video/init/", token=token, json_body={"source_info": _source_info(video)})
    _upload(res["data"]["upload_url"], video)
    return res["data"]["publish_id"]


def direct_post(token: str, video: Path, caption: str, privacy: str, duration_s: float, cover_ms: int = 1400) -> str:
    info = creator_info(token)
    options = info.get("privacy_level_options", [])
    if privacy not in options:
        raise TikTokError(f"privacy level {privacy} not allowed for this account/app; allowed: {options}")
    max_dur = info.get("max_video_post_duration_sec")
    if max_dur and duration_s > max_dur:
        raise TikTokError(f"video is {duration_s}s but this account allows {max_dur}s")
    body = {
        "post_info": {
            "title": caption[:2200],
            "privacy_level": privacy,
            "disable_comment": bool(info.get("comment_disabled", False)),
            "disable_duet": bool(info.get("duet_disabled", False)),
            "disable_stitch": bool(info.get("stitch_disabled", False)),
            "video_cover_timestamp_ms": cover_ms,
            # Disclosure: these videos promote the creator's own brand (Money Quest).
            "brand_content_toggle": False,
            "brand_organic_toggle": True,
        },
        "source_info": _source_info(video),
    }
    res = _request("POST", f"{API}/v2/post/publish/video/init/", token=token, json_body=body)
    _upload(res["data"]["upload_url"], video)
    return res["data"]["publish_id"]


def publish_status(token: str, publish_id: str) -> dict:
    return _request("POST", f"{API}/v2/post/publish/status/fetch/", token=token, json_body={"publish_id": publish_id})["data"]


def wait_for_status(token: str, publish_id: str, timeout_s: int = 300) -> dict:
    deadline = time.time() + timeout_s
    last = {}
    while time.time() < deadline:
        last = publish_status(token, publish_id)
        if last.get("status") in ("PUBLISH_COMPLETE", "SEND_TO_USER_INBOX", "FAILED"):
            return last
        time.sleep(10)
    return last


# -- Metrics ----------------------------------------------------------------
METRIC_FIELDS = "id,title,create_time,share_url,view_count,like_count,comment_count,share_count"


def list_videos(token: str, max_pages: int = 5) -> list[dict]:
    videos, cursor = [], None
    for _ in range(max_pages):
        body = {"max_count": 20}
        if cursor:
            body["cursor"] = cursor
        res = _request("POST", f"{API}/v2/video/list/?fields={METRIC_FIELDS}", token=token, json_body=body)["data"]
        videos += res.get("videos", [])
        if not res.get("has_more"):
            break
        cursor = res.get("cursor")
    return videos
