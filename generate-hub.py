#!/usr/bin/env python3
import json, re, subprocess, datetime
from pathlib import Path
from urllib.parse import urlparse

SITES_DIR   = Path("/etc/nginx/sites-enabled")
FE_DIR      = Path("/home/son/prj/dev_portfolio/fe")
EXTRAS      = Path("/home/son/prj/dev_portfolio/hub-extras.json")
TEMPLATE    = Path("/home/son/prj/dev_portfolio/hub-template.html")
LEARN_NGINX = SITES_DIR / "learn.ericfromkorea.com"
LEARN_META  = Path("/home/son/prj/dev_portfolio/learn-sub-meta.json")
LEARN_ROOT  = Path("/var/www/learn.ericfromkorea.com")
SKIP        = {"default", "hub.ericfromkorea.com", "ericfromkorea.com", "print.ericfromkorea.dev"}

def _get(text, prefix, key):
    m = re.search(rf'^{re.escape(prefix)}{key}:\s*(.+)$', text, re.MULTILINE)
    return m.group(1).strip() if m else None

def parse_meta(path: Path) -> dict | None:
    text = path.read_text()
    title = _get(text, "# hub-", "title")
    if not title:
        return None
    return {
        "title": title,
        "desc":  _get(text, "# hub-", "desc") or "",
        "url":   _get(text, "# hub-", "url") or f"https://{path.name}/",
        "order": int(_get(text, "# hub-", "order") or 99),
    }

def path_to_title(path: str) -> str:
    name = path.strip("/").replace("-", " ").replace("_", " ")
    return name.title()

def detect_sub_paths(nginx_path: Path) -> list[str]:
    """Return unique content-serving location paths (no redirects, no internal paths)."""
    text = nginx_path.read_text()
    seen, paths = set(), []
    for m in re.finditer(r'location\s+(?:[=~^*]+\s+)?(/[^\s{]+)', text):
        path = m.group(1).rstrip("=")
        if not path.endswith("/"):
            path += "/"
        if path in seen or path in {"/", "/.well-known/acme-challenge/"}:
            continue
        # skip redirect-only blocks
        block_start = m.end()
        brace = text.find("{", block_start)
        closing = text.find("}", brace)
        body = text[brace:closing]
        if re.search(r'\breturn\s+30[12]', body):
            continue
        seen.add(path)
        paths.append(path)
    return paths

def detect_static_paths(root: Path) -> list[str]:
    """Webroot subdirs with an index.html, served via `location /` + try_files."""
    if not root.exists():
        return []
    return [f"/{d.name}/" for d in sorted(root.iterdir())
            if d.is_dir() and (d / "index.html").exists()]

def collect_sub_sites() -> list[dict]:
    meta = json.loads(LEARN_META.read_text()) if LEARN_META.exists() else {}
    paths = detect_sub_paths(LEARN_NGINX)
    for p in detect_static_paths(LEARN_ROOT):
        if p not in paths:
            paths.append(p)
    updated = False
    sites = []
    for path in paths:
        if path not in meta:
            meta[path] = {"title": path_to_title(path), "desc": "", "order": 99}
            updated = True
        entry = meta[path]
        if entry.get("hidden"):
            continue
        sites.append({"title": entry["title"], "desc": entry["desc"],
                       "url": path, "order": entry["order"]})
    if updated:
        LEARN_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        print(f"[learn] added {sum(1 for p in paths if p not in json.loads(LEARN_META.read_text()))} new paths to learn-sub-meta.json")
    return sorted(sites, key=lambda s: s["order"])

def url_label(url: str) -> str:
    p = urlparse(url)
    return (p.netloc + p.path).rstrip("/") or url

def card(site: dict) -> str:
    return (
        f'    <a class="card" href="{site["url"]}">\n'
        f'      <div class="title">{site["title"]} '
        f'<span class="url">{url_label(site["url"])}</span></div>\n'
        f'      <p class="desc">{site["desc"]}</p>\n'
        f'    </a>'
    )

def render(title, intro, footer, sites) -> str:
    cards = "\n\n".join(card(s) for s in sites)
    return (TEMPLATE.read_text()
        .replace("{{TITLE}}",  title)
        .replace("{{INTRO}}",  intro)
        .replace("{{CARDS}}",  cards)
        .replace("{{FOOTER}}", footer))

def rebuild_docker():
    # fe/ is bind-mounted so editor writes persist; --user keeps files owned by son.
    # --env-file supplies EDITOR_PASSWORD/EDITOR_SECRET for the editor API.
    subprocess.run(["docker", "build", "-t", "dev-portfolio-fe", str(FE_DIR)], check=True)
    subprocess.run(["docker", "stop", "dev-portfolio-fe"], capture_output=True)
    subprocess.run(["docker", "rm",   "dev-portfolio-fe"], capture_output=True)
    subprocess.run([
        "docker", "run", "-d", "--name", "dev-portfolio-fe",
        "--restart", "unless-stopped", "-p", "60022:8000",
        "--user", "1000:1000",
        "-v", f"{FE_DIR}:/app",
        "--env-file", "/home/son/prj/dev_portfolio/.editor-secret",
        "dev-portfolio-fe",
    ], check=True)

def gen_main_hub():
    sites = []
    for p in sorted(SITES_DIR.iterdir()):
        if p.name not in SKIP:
            m = parse_meta(p)
            if m:
                sites.append(m)
    if EXTRAS.exists():
        sites.extend(json.loads(EXTRAS.read_text()))
    sites.sort(key=lambda s: s["order"])
    html = render("에릭프롬코리아", "공개 페이지, 도구, 실험용 앱을 모아둔 허브입니다.",
                  f"마지막 업데이트: {datetime.date.today().isoformat()}", sites)
    for fname in ["index.html", "hub.html"]:
        (FE_DIR / fname).write_text(html)
    rebuild_docker()
    print(f"[hub] regenerated {len(sites)} sites → Docker rebuilt")

def gen_learn_hub():
    sites = collect_sub_sites()
    html  = render("Learn", "학습 도구와 노트를 모아둔 공간입니다.",
                   "learn.ericfromkorea.com", sites)
    (LEARN_ROOT / "index.html").write_text(html)
    print(f"[learn] regenerated {len(sites)} sub-pages")

if __name__ == "__main__":
    gen_main_hub()
    gen_learn_hub()
