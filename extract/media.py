"""미디어 블록 처리 — rich text 스팬, 이미지 다운로드, 동영상/임베드 정규화."""
import urllib.request
from pathlib import Path

FE = Path("/home/son/prj/dev_portfolio/fe")
IMGDIR = FE / "assets" / "img" / "projects"
VIDDIR = FE / "assets" / "video"
EXTS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mov")


def spans(rich):
    """Notion rich_text 배열 → 사이트 스팬 배열."""
    res = []
    for r in rich or []:
        a = r.get("annotations", {})
        s = {"text": r.get("plain_text", "")}
        for k in ("bold", "italic", "strikethrough", "underline", "code"):
            if a.get(k):
                s[k] = True
        if a.get("color") and a["color"] != "default":
            s["color"] = a["color"]
        if r.get("href"):
            s["href"] = r["href"]
        res.append(s)
    return res


def _ext_of(url, default):
    low = url.lower().split("?")[0]
    for e in EXTS:
        if low.endswith(e):
            return e
    return default


def _download(url, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())


def dl_image(block, slug, idx):
    """이미지 블록: 파일을 로컬로 받고 image 노드를 만든다."""
    img = block["image"]
    url = img.get("file", {}).get("url") or img.get("external", {}).get("url")
    if not url:
        return None
    fname = f"{idx:02d}{_ext_of(url, '.png')}"
    _download(url, IMGDIR / slug / fname)
    return {"type": "image", "src": f"assets/img/projects/{slug}/{fname}",
            "caption": spans(img.get("caption"))}


def media_node(block, slug, t):
    """video/embed 블록: 외부 URL은 유지, Notion 업로드 동영상은 로컬로 받는다."""
    body = block[t]
    url = (body.get("external") or {}).get("url") or body.get("url") or ""
    furl = (body.get("file") or {}).get("url")
    if not url and furl:  # Notion 호스팅 파일은 URL이 만료되므로 다운로드
        # 블록 ID 앞부분은 생성 시점이 비슷하면 겹치므로 뒤 12자를 쓴다
        fname = f"{block['id'].replace('-', '')[-12:]}{_ext_of(furl, '.mp4')}"
        _download(furl, VIDDIR / slug / fname)
        url = f"assets/video/{slug}/{fname}"
    if not url:
        return None
    node = {"type": t, "url": url}
    cap = spans(body.get("caption"))
    if cap:
        node["caption"] = cap
    return node
