"""Notion 동기화 — extract 스크립트를 백그라운드 스레드로 실행, 로그 실시간 수집."""
import os, subprocess, sys, threading, time

EXTRACT = os.environ.get("EXTRACT_DIR", "/extract")
STATE = {"running": False, "ok": None, "log": "", "started": 0}
_lock = threading.Lock()


def start(slug: str | None) -> bool:
    """동기화 시작. 이미 실행 중이면 False."""
    with _lock:
        if STATE["running"]:
            return False
        STATE.update(running=True, ok=None, log="", started=time.time())
    threading.Thread(target=_run, args=(slug,), daemon=True).start()
    return True


def _run(slug):
    cmd = [sys.executable, "-u", os.path.join(EXTRACT, "notion_extract.py")]
    if slug:
        cmd.append(slug)
    env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                text=True, cwd=EXTRACT, env=env)
        for line in proc.stdout:  # 줄 단위로 로그 누적 → 프론트가 진행률 표시
            STATE["log"] = (STATE["log"] + line)[-3000:]
        proc.wait(timeout=900)
        STATE["ok"] = proc.returncode == 0
    except Exception as e:
        STATE["log"] += f"\n{e}"
        STATE["ok"] = False
        try:
            proc.kill()
        except Exception:
            pass
    STATE["running"] = False


def status() -> dict:
    return {**STATE, "elapsed": round(time.time() - STATE["started"]) if STATE["running"] else 0}
