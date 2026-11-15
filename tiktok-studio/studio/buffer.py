"""Publishing through Buffer (https://buffer.com), using Buffer's own TikTok
integration, which TikTok has already approved.

Why Buffer: TikTok does not approve Content Posting API apps that only post
to the developer's own account(s) ("personal or internal use"), so without an
audit our direct integration can only make private posts. Buffer is an
approved TikTok partner, its Free plan includes TikTok auto-publishing and
API access, and we only need a personal Buffer API key.

API: GraphQL at https://api.buffer.com, `Authorization: Bearer <BUFFER_API_KEY>`.
Buffer does not accept file uploads: the video must be at a public HTTPS URL
that stays reachable until the post is published (see hosting.py).

Parts of Buffer's documentation conflict with each other, so before the first
post run `python -m studio buffer-setup`. It introspects the live schema and
reports any field this client relies on that Buffer doesn't expose.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import urllib.error
import urllib.request

API = "https://api.buffer.com"


class BufferError(RuntimeError):
    pass


def _key() -> str:
    k = os.environ.get("BUFFER_API_KEY", "").strip()
    if not k:
        raise BufferError("Missing BUFFER_API_KEY (create it in Buffer: Settings > API; store it as a GitHub secret)")
    return k


def gql(query: str, variables: dict | None = None) -> dict:
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(API, data=body, method="POST", headers={
        "Authorization": f"Bearer {_key()}",
        "Content-Type": "application/json",
        "User-Agent": "money-quest-studio",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            payload = json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise BufferError(f"HTTP {e.code}: {e.read()[:400].decode(errors='replace')}") from None
    if payload.get("errors"):
        raise BufferError("; ".join(err.get("message", str(err)) for err in payload["errors"]))
    return payload.get("data") or {}


# -- account & channels -------------------------------------------------------
def organizations() -> list[dict]:
    return gql("query { account { organizations { id name } } }")["account"]["organizations"]


def channels(org_id: str) -> list[dict]:
    q = "query($o: OrganizationId!) { channels(input: {organizationId: $o}) { id name service isQueuePaused } }"
    try:
        return gql(q, {"o": org_id})["channels"]
    except BufferError:
        # Some schema versions type the id as String.
        q = q.replace("OrganizationId!", "String!")
        return gql(q, {"o": org_id})["channels"]


def tiktok_channels() -> list[dict]:
    found = []
    for org in organizations():
        for ch in channels(org["id"]):
            if ch.get("service", "").lower() == "tiktok":
                found.append({**ch, "organization": org["name"], "organizationId": org["id"]})
    return found


# -- schema verification ------------------------------------------------------
REQUIRED = {
    "CreatePostInput": ["text", "channelId", "schedulingType", "mode", "dueAt", "assets"],
    "AssetInput": ["video"],
    "Post": ["id", "status", "dueAt", "sentAt", "externalLink"],
}
ENUMS = {"SchedulingType": ["automatic", "notification"], "ShareMode": ["customScheduled"]}


def schema_report() -> list[str]:
    """Returns a list of problems (empty = this client matches the live API)."""
    problems = []
    for type_name, fields in REQUIRED.items():
        data = gql("query($n: String!) { __type(name: $n) { name fields { name } inputFields { name } } }", {"n": type_name})
        t = data.get("__type")
        if not t:
            problems.append(f"type {type_name} not found (introspection may be disabled)")
            continue
        names = {f["name"] for f in (t.get("fields") or []) + (t.get("inputFields") or [])}
        problems += [f"{type_name}.{f} missing (has: {sorted(names)})" for f in fields if f not in names]
    for enum, values in ENUMS.items():
        data = gql("query($n: String!) { __type(name: $n) { enumValues { name } } }", {"n": enum})
        t = data.get("__type")
        if not t:
            problems.append(f"enum {enum} not found")
            continue
        names = {v["name"] for v in t.get("enumValues") or []}
        problems += [f"{enum}.{v} missing (has: {sorted(names)})" for v in values if v not in names]
    return problems


# -- posting --------------------------------------------------------------------
CREATE = """
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id status dueAt } }
    ... on MutationError { message }
  }
}"""


def create_post(channel_id: str, text: str, video_url: str, scheduling: str, due_at: dt.datetime, thumbnail_ms: int = 1400) -> dict:
    """scheduling = 'notification' (Buffer reminds you; you post from your phone)
    or 'automatic' (Buffer publishes to TikTok at due_at, publicly)."""
    if scheduling not in ("notification", "automatic"):
        raise BufferError(f"bad scheduling type {scheduling}")
    variables = {"input": {
        "text": text,
        "channelId": channel_id,
        "schedulingType": scheduling,
        "mode": "customScheduled",
        "dueAt": due_at.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "assets": [{"video": {"url": video_url, "metadata": {"thumbnailOffset": thumbnail_ms}}}],
    }}
    res = gql(CREATE, variables)["createPost"]
    if "message" in res and "post" not in res:
        raise BufferError(f"Buffer refused the post: {res['message']}")
    return res["post"]


def get_post(post_id: str) -> dict:
    q = "query($id: PostId!) { post(input: {id: $id}) { id status dueAt sentAt externalLink } }"
    try:
        return gql(q, {"id": post_id})["post"]
    except BufferError:
        return gql(q.replace("PostId!", "String!"), {"id": post_id})["post"]


METRICS = """
query($org: OrganizationId!, $ch: [ChannelId!]) {
  posts(input: {organizationId: $org, filter: {status: [sent], channelIds: $ch}}, first: 50) {
    edges { node { id sentAt externalLink metrics { type name value unit } } }
  }
}"""


def sent_posts_with_metrics(org_id: str, channel_id: str) -> list[dict]:
    """Experimental in Buffer (metrics refresh about once a day). Returns
    [{id, sentAt, externalLink, metrics: {name: value}}]."""
    data = gql(METRICS, {"org": org_id, "ch": [channel_id]})
    out = []
    for edge in data["posts"]["edges"]:
        n = edge["node"]
        out.append({**n, "metrics": {m["name"].lower(): m["value"] for m in n.get("metrics") or []}})
    return out


def normalise_metrics(raw: dict) -> dict:
    """Map Buffer's generic metric names onto the counts the topic selector uses."""
    def pick(*words):
        for k, v in raw.items():
            if any(w in k for w in words):
                try:
                    return int(float(v))
                except (TypeError, ValueError):
                    pass
        return 0
    return {
        "view_count": pick("view", "play", "impression"),
        "like_count": pick("like", "reaction"),
        "comment_count": pick("comment"),
        "share_count": pick("share"),
    }
