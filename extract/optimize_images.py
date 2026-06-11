#!/usr/bin/env python3
"""Resize/compress downloaded project images in place to keep the site light."""
from pathlib import Path
from PIL import Image

ROOT = Path("/home/son/prj/dev_portfolio/fe/assets/img/projects")
MAX_W = 1280

def process(p: Path):
    try:
        im = Image.open(p)
    except Exception as e:
        print("skip", p.name, e); return 0
    before = p.stat().st_size
    changed = False
    if im.width > MAX_W:
        h = round(im.height * MAX_W / im.width)
        im = im.resize((MAX_W, h), Image.LANCZOS)
        changed = True
    ext = p.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        im.convert("RGB").save(p, "JPEG", quality=82, optimize=True)
    else:
        im.save(p, "PNG", optimize=True)
    after = p.stat().st_size
    return before - after if (changed or after < before) else 0

def main():
    total = saved = 0
    for p in sorted(ROOT.rglob("*")):
        if p.is_file() and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
            total += 1
            saved += process(p)
    mb = saved / (1024 * 1024)
    print(f"optimized {total} images, saved {mb:.1f} MB")

if __name__ == "__main__":
    main()
