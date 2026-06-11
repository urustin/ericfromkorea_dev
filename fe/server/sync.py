"""Notion 동기화 — extract 스크립트를 백그라운드 스레드로 실행한다."""
import os, subprocess, sys, threading

EXTRACT = os.environ.get("EXTRACT_DIR", "/extract")
STATE = {"running": False, "ok": None, "log": ""}
_lock = threading.Lock()


def start(slug: str | None) -> bool:
    """동기화 시작. 이미 실행 중이면 False."""
    with _lock:
        if STATE["running"]:
            return False
        STATE.update(running=True, ok=None, log="")
    threading.Thread(target=_run, args=(slug,), daemon=True).start()
    return True


def _run(slug):
    cmd = [sys.executable, os.path.join(EXTRACT, "notion_extract.py")]
    if slug:
        cmd.append(slug)
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=900,
                           cwd=EXTRACT, env=env)
        STATE["log"] = (r.stdout + r.stderr)[-2000:]
        STATE["ok"] = r.returncode == 0
    except Exception as e:  # 타임아웃 등
        STATE["log"] = str(e)
        STATE["ok"] = False
    STATE["running"] = False


def status() -> dict:
    return dict(STATE)
