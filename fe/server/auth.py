"""HMAC-signed bearer tokens (24h) + constant-time password check."""
import base64, hashlib, hmac, json, os, time

SECRET = os.environ.get("EDITOR_SECRET", "").encode()
PASSWORD = os.environ.get("EDITOR_PASSWORD", "")
TTL = 24 * 3600


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(payload: str) -> str:
    return _b64(hmac.new(SECRET, payload.encode(), hashlib.sha256).digest())


def issue():
    exp = int(time.time()) + TTL
    payload = _b64(json.dumps({"exp": exp}).encode())
    return f"{payload}.{_sign(payload)}", exp


def verify(token: str) -> bool:
    try:
        payload, sig = token.split(".")
        if not hmac.compare_digest(sig, _sign(payload)):
            return False
        return json.loads(_unb64(payload))["exp"] > time.time()
    except Exception:
        return False


def check_password(pw: str) -> bool:
    return bool(PASSWORD) and hmac.compare_digest(pw or "", PASSWORD)
