"""Persistence helpers — atomic JSON writes + image uploads under /app."""
import json, os, re, time

APP = os.environ.get("APP_ROOT", "/app")
DATA = os.path.join(APP, "js", "data")
DETAILS = os.path.join(DATA, "details")
UPLOADS = os.path.join(APP, "assets", "img", "uploads")
SLUG_RE = re.compile(r"^[a-z0-9가-힣\-]{1,60}$")
EXT_OK = {"png", "jpg", "jpeg", "gif", "webp", "svg"}


def _atomic_write(path: str, data: bytes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def save_json(name: str, obj):
    _atomic_write(os.path.join(DATA, name), json.dumps(obj, ensure_ascii=False, indent=2).encode())


def save_detail(slug: str, blocks):
    if not SLUG_RE.match(slug) or not isinstance(blocks, list):
        raise ValueError("bad slug or body")
    _atomic_write(os.path.join(DETAILS, f"{slug}.json"),
                  json.dumps(blocks, ensure_ascii=False, separators=(",", ":")).encode())


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9가-힣]+", "-", (name or "").lower()).strip("-")[:40]
    return s or "page"


def create_page(name: str) -> dict:
    """Append a new project row + empty detail file; return the row."""
    name = (name or "").strip() or "제목 없음"
    path = os.path.join(DATA, "projects.json")
    rows = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else []
    base = _slugify(name)
    slug, n, existing = base, 2, {r.get("id") for r in rows}
    while slug in existing:
        slug, n = f"{base}-{n}", n + 1
    row = {"id": slug, "name": name, "status": "Not started", "type": "",
           "date": "", "client": "", "summary": "", "skills": []}
    rows.append(row)
    save_json("projects.json", rows)
    save_detail(slug, [])
    return row


def save_upload(name: str, data: bytes) -> str:
    ext = (name.rsplit(".", 1)[-1] if "." in name else "png").lower()
    if ext not in EXT_OK:
        ext = "png"
    base = re.sub(r"[^a-zA-Z0-9_-]", "", name.rsplit(".", 1)[0])[:30] or "img"
    fname = f"{int(time.time())}-{base}.{ext}"
    _atomic_write(os.path.join(UPLOADS, fname), data)
    return f"assets/img/uploads/{fname}"
