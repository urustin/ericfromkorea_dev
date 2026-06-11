#!/usr/bin/env python3
"""Fetch project page bodies from Notion, normalize blocks, localize images."""
import json, os, sys, time, urllib.request, urllib.error
from pathlib import Path
from slugs import SLUGS  # {slug: page_id}
import media
from media import spans, dl_image, media_node
from dbsync import sync_projects

TOKEN = os.environ["NOTION_TOKEN"]
FE = Path(os.environ.get("FE_DIR", "/home/son/prj/dev_portfolio/fe"))
OUT = FE / "js" / "data" / "details"
IMGDIR = FE / "assets" / "img" / "projects"
HDR = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2022-06-28"}

KEEP = {"paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item",
        "numbered_list_item", "to_do", "quote", "callout", "code", "divider",
        "image", "toggle", "column_list", "column", "table", "table_row", "bookmark",
        "child_page", "video", "embed"}
SUBPAGES = {}  # 서브페이지 레지스트리 {slug: {"title", "parent"}}


def api(url):
    req = urllib.request.Request(url, headers=HDR)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(1 + attempt); continue
            raise
    raise RuntimeError("retries exhausted: " + url)


def children(block_id):
    out, cursor = [], None
    while True:
        url = f"https://api.notion.com/v1/blocks/{block_id}/children?page_size=100"
        if cursor:
            url += f"&start_cursor={cursor}"
        data = api(url)
        out.extend(data["results"])
        if not data.get("has_more"):
            break
        cursor = data["next_cursor"]
    return out




def norm(blocks, slug, counter):
    out = []
    for b in blocks:
        t = b["type"]
        if t not in KEEP:
            continue
        if t == "child_page":  # 서브페이지: 별도 detail로 재귀 추출하고 링크 블록 생성
            sub = f"{slug}-sub-{b['id'].replace('-', '')[:8]}"
            title = b["child_page"].get("title", "제목 없음")
            SUBPAGES[sub] = {"title": title, "parent": slug}
            (OUT / f"{sub}.json").write_text(json.dumps(
                norm(children(b["id"]), sub, [0]), ensure_ascii=False, separators=(",", ":")))
            out.append({"type": "child_page", "title": title, "slug": sub})
            continue
        if t in ("video", "embed"):  # 동영상/임베드: URL 보존, 업로드 파일은 다운로드
            node = media_node(b, slug, t)
            if node:
                out.append(node)
            continue
        if t == "image":
            counter[0] += 1
            node = dl_image(b, slug, counter[0])
            if node:
                out.append(node)
            continue
        node = {"type": t}
        body = b.get(t, {})
        if "rich_text" in body:
            node["rich"] = spans(body["rich_text"])
        if body.get("color") and body["color"] != "default":
            node["color"] = body["color"]
        if t == "callout" and body.get("icon", {}).get("type") == "emoji":
            node["icon"] = body["icon"]["emoji"]
        if t == "code":
            node["lang"] = body.get("language", "")
        if t == "to_do":
            node["checked"] = body.get("checked", False)
        if t == "table":
            node["has_col_header"] = body.get("has_column_header", False)
        if t == "table_row":
            node["cells"] = [spans(c) for c in body.get("cells", [])]
        if t == "bookmark":  # 북마크는 url과 캡션을 보존한다
            node["url"] = body.get("url", "")
            cap = spans(body.get("caption"))
            if cap:
                node["caption"] = cap
        if b.get("has_children") and t != "table_row":
            node["children"] = norm(children(b["id"]), slug, counter)
        # drop empty paragraphs (Notion spacing) unless they carry children
        if t == "paragraph" and not node.get("rich") and not node.get("children"):
            continue
        out.append(node)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])  # 인자로 slug를 주면 해당 페이지만 동기화
    db_only = "--db-only" in only  # 목록 페이지용: DB 행 정보만 갱신, 본문은 생략
    only -= {"--db-only"}
    media.SKIP_EXISTING = not only  # 전체 동기화는 기존 미디어 재다운로드 생략(속도)
    # 프로젝트 DB(이름/상태/날짜/스킬 등) 동기화 — 새 행은 본문도 함께 추출
    rowmap = sync_projects(TOKEN, SLUGS)
    if db_only:
        return
    pages = {**SLUGS, **rowmap}
    reg_path = FE / "js" / "data" / "subpages.json"
    if reg_path.exists():  # 기존 레지스트리 유지(에디터에서 만든 서브페이지 보존)
        SUBPAGES.update(json.loads(reg_path.read_text()))
    for slug, pid in pages.items():
        if only and slug not in only:
            continue
        blocks = norm(children(pid), slug, [0])
        if slug == "profile-body":  # 프로필은 Skills부터만 사용 (위는 사이트가 동적 렌더)
            i = next((i for i, b in enumerate(blocks) if b["type"].startswith("heading")
                      and "".join(s["text"] for s in b.get("rich", [])).strip() == "Skills"), 0)
            blocks = blocks[i:]
        (OUT / f"{slug}.json").write_text(
            json.dumps(blocks, ensure_ascii=False, separators=(",", ":")))
        print(f"{slug}: {len(blocks)} blocks", flush=True)
    reg_path.write_text(json.dumps(SUBPAGES, ensure_ascii=False, indent=1))
    print(f"subpages: {len(SUBPAGES)}", flush=True)


if __name__ == "__main__":
    main()
