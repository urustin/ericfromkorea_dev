"""Static file server + editor API for the dev portfolio."""
import json, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import auth
import store

APP = os.environ.get("APP_ROOT", "/app")
MAX_BODY = 25 * 1024 * 1024


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=APP, **k)

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _authed(self):
        h = self.headers.get("Authorization", "")
        return h.startswith("Bearer ") and auth.verify(h[7:])

    def _read(self):
        n = int(self.headers.get("Content-Length", 0))
        if n > MAX_BODY:
            raise ValueError("body too large")
        return self.rfile.read(n)

    # --- routing ---------------------------------------------------------
    def do_GET(self):
        if self.path == "/api/me":
            return self._json(200 if self._authed() else 401, {"authed": self._authed()})
        # dev.* 도메인의 루트(/)는 포트폴리오를 바로 보여준다 (hub.* 는 허브 유지)
        host = self.headers.get("Host", "")
        if self.path == "/" and host.startswith("dev."):
            self.path = "/portfolio.html"
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/login":
            return self._login()
        if self.path == "/api/page":
            return self._guard(self._new_page)
        if self.path.split("?")[0] == "/api/upload":
            return self._guard(self._upload)
        return self._json(404, {"error": "not found"})

    def do_PUT(self):
        return self._guard(self._put)

    def _guard(self, fn):
        if not self._authed():
            return self._json(401, {"error": "unauthorized"})
        try:
            return fn()
        except Exception as e:
            return self._json(400, {"error": str(e)})

    # --- handlers --------------------------------------------------------
    def _login(self):
        try:
            pw = json.loads(self._read() or b"{}").get("password", "")
        except Exception:
            return self._json(400, {"error": "bad request"})
        if not auth.check_password(pw):
            return self._json(401, {"error": "비밀번호가 올바르지 않습니다."})
        token, exp = auth.issue()
        self._json(200, {"token": token, "exp": exp})

    def _put(self):
        p = self.path
        data = json.loads(self._read() or b"null")
        if p == "/api/profile" and isinstance(data, dict):
            store.save_json("profile.json", data)
        elif p == "/api/projects" and isinstance(data, list):
            store.save_json("projects.json", data)
        elif p.startswith("/api/detail/"):
            store.save_detail(p[len("/api/detail/"):], data)
        else:
            return self._json(404, {"error": "unknown resource"})
        self._json(200, {"ok": True})

    def _new_page(self):
        name = json.loads(self._read() or b"{}").get("name", "")
        self._json(200, store.create_page(name))

    def _upload(self):
        from urllib.parse import urlparse, parse_qs
        name = parse_qs(urlparse(self.path).query).get("name", ["img.png"])[0]
        src = store.save_upload(name, self._read())
        self._json(200, {"src": src})


def main():
    port = int(os.environ.get("PORT", "8000"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
