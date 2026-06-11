"""Notion 'All Projects' 데이터베이스 → projects.json 동기화."""
import json, os, re, urllib.request
from pathlib import Path

DS = "d026bef06d204ec2bb3bef3a25cae806"  # All Projects (한글) 데이터소스 ID
FE = Path(os.environ.get("FE_DIR", "/home/son/prj/dev_portfolio/fe"))


def _api(url, token, body=None):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode() if body else None,
        headers={"Authorization": f"Bearer {token}", "Notion-Version": "2025-09-03",
                 "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def _txt(rich):
    return "".join(t.get("plain_text", "") for t in rich or []).strip()


def _slugify(name):
    s = re.sub(r"[^a-z0-9가-힣]+", "-", (name or "").lower()).strip("-")[:40]
    return s or "page"


def _row(p):
    """Notion 프로퍼티 → 사이트 프로젝트 행."""
    date = p["Date"].get("date") or {}
    return {
        "name": _txt(p["이름"]["title"]),
        "status": (p["Status"].get("status") or {}).get("name", "Not started"),
        "type": (p["Type"].get("select") or {}).get("name", ""),
        "date": (date.get("start") or "")[:10],
        "client": _txt(p["Client"]["rich_text"]),
        "summary": _txt(p["Summary"]["rich_text"]),
        "skills": [o["name"] for o in p["Skill & Library"]["multi_select"]],
    }


def sync_projects(token, slugs):
    """DB 전체를 projects.json으로 반영. 반환: {slug: page_id} (본문 추출용)."""
    id2slug = {pid.replace("-", ""): s for s, pid in slugs.items()}
    results, cursor = [], None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        d = _api(f"https://api.notion.com/v1/data_sources/{DS}/query", token, body)
        results += d["results"]
        if not d.get("has_more"):
            break
        cursor = d["next_cursor"]

    path = FE / "js" / "data" / "projects.json"
    old = json.loads(path.read_text()) if path.exists() else []
    out, rowmap = [], {}
    for r in results:
        pid = r["id"].replace("-", "")
        name = _txt(r["properties"]["이름"]["title"])
        if not name:  # 이름 없는 빈 행은 무시
            continue
        slug = id2slug.get(pid) or _slugify(name)
        while slug in rowmap:  # 새 행 슬러그 충돌 방지
            slug += "-2"
        rowmap[slug] = r["id"]
        out.append({"id": slug, **_row(r["properties"])})
    # Notion에 없는 로컬 행(사이트 에디터로 만든 페이지)은 뒤에 보존
    out += [r for r in old if r["id"] not in rowmap]
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"projects.json: {len(results)} rows from Notion", flush=True)
    return rowmap
