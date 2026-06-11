# dev_portfolio

`https://dev.ericfromkorea.com` 으로 서빙되는 개인 개발 포트폴리오 사이트.

콘텐츠 원본은 Notion 워크스페이스이며, 추출 스크립트로 JSON화해 정적으로 서빙한다.
사이트 자체에 내장 에디터가 있어 추출된 콘텐츠를 브라우저에서 직접 수정할 수도 있다.

## 디렉토리 구조

```
dev_portfolio/
├── fe/                      # 프론트엔드 + 서버 (Docker로 배포되는 부분)
│   ├── index.html           # 메인 페이지
│   ├── portfolio.html       # 이력서/프로필 페이지
│   ├── projects.html        # 프로젝트 목록 (필터/테이블)
│   ├── project.html         # 프로젝트 상세 (Notion 블록 렌더링)
│   ├── login.html           # 에디터 로그인
│   ├── hub.html             # 서브사이트 허브 (generate-hub.py가 생성)
│   ├── js/
│   │   ├── data/            # 콘텐츠 JSON (projects.json, profile.json, details/*.json)
│   │   ├── notion/          # Notion 블록 → DOM 렌더러
│   │   ├── editor/          # 내장 콘텐츠 에디터
│   │   └── projects/        # 프로젝트 목록 필터/테이블 로직
│   ├── css/
│   ├── assets/img/projects/ # Notion에서 로컬화한 프로젝트 이미지
│   ├── server/              # Python 표준 라이브러리 기반 정적 서버 + 에디터 API
│   │   ├── server.py        # HTTP 핸들러 (정적 파일 + /api)
│   │   ├── auth.py          # Bearer 토큰 인증
│   │   └── store.py         # JSON 데이터 읽기/쓰기
│   └── Dockerfile
├── extract/                 # Notion → JSON 추출 파이프라인
│   ├── notion_extract.py    # 페이지 본문 추출, 블록 정규화, 이미지 로컬화
│   ├── slugs.py             # slug → Notion 페이지 ID 매핑
│   ├── optimize_images.py   # 이미지 최적화
│   └── cdp_live.js          # CDP(Chrome DevTools Protocol) 보조 스크립트
├── generate-hub.py          # nginx sites-enabled 스캔 → hub.html 자동 생성 (cron 실행)
├── hub-template.html        # 허브 페이지 템플릿
├── hub-extras.json          # 허브에 수동 추가하는 사이트 목록
├── learn-sub-meta.json      # learn.ericfromkorea.com 하위 경로 메타데이터
├── deploy_hub_cert.sh       # 허브 도메인 인증서 배포 스크립트
└── nginx_*.conf             # nginx 설정 사본 (실제 위치: /etc/nginx/sites-available/)
```

## 메모리 파일

`~/.claude/projects/-home-son-prj-dev-portfolio/memory/`

| 파일 | 내용 |
|------|------|
| `MEMORY.md` | 인덱스 |
| `project-overview.md` | 프로젝트 개요 (Notion 연동 구조, 에디터, 허브) |
| `project_paths.md` | 주요 경로 규칙 |
| `tigervnc-systemd.md` | 서버 VNC 설정 메모 |

## 실행 방법

### 1. Notion 콘텐츠 추출 (콘텐츠 갱신 시)

```bash
cd extract
NOTION_TOKEN=<통합 토큰> python3 notion_extract.py   # → fe/js/data/details/*.json + 이미지
python3 optimize_images.py                           # 이미지 최적화
```

### 2. 빌드 & 배포

**실제 배포는 son-wtr(192.168.1.121, ssh 별칭 `aoo`)에서 돌아간다.** 이 머신(GPU 서버)은 작업용.

```bash
# 변경 파일을 son-wtr로 복사 후 재빌드
scp <변경파일> aoo:~/prj/dev_portfolio/<경로>
ssh aoo 'cd ~/prj/dev_portfolio/fe && docker build -t dev-portfolio-fe . \
  && docker rm -f dev-portfolio-fe \
  && docker run -d --name dev-portfolio-fe -p 60022:8000 --restart unless-stopped dev-portfolio-fe'
```

### 3. 허브 페이지 갱신 (son-wtr cron이 매일 11:00 자동 실행)

```bash
python3 generate-hub.py   # → fe/index.html + fe/hub.html 생성 후 docker 재빌드
```

## 인프라

| 항목 | 내용 |
|------|------|
| 배포 머신 | son-wtr (192.168.1.121, ssh `aoo`) — nginx + 모든 서비스 컨테이너 |
| 컨테이너 | `dev-portfolio-fe` (python:3.12-alpine), 내부 8000 → 호스트 60022 |
| 도메인 | `dev.ericfromkorea.com`, `hub.ericfromkorea.com` — 같은 컨테이너로 프록시 |
| 루트 라우팅 | 서버가 Host 헤더로 분기: `dev.*`의 `/` → portfolio.html, 그 외 → index.html(허브) |
| nginx | son-wtr의 `/etc/nginx/sites-available/` (80 → HTTPS 리다이렉트, 443 → `localhost:60022`) |
| 에디터 인증 | `.editor-secret`의 `EDITOR_PASSWORD` (git 제외) |

## 주요 경로 요약

| 용도 | 경로 |
|------|------|
| 콘텐츠 JSON | `fe/js/data/` |
| 프로젝트 이미지 | `fe/assets/img/projects/` |
| Notion 매핑 | `extract/slugs.py` |
| nginx 실제 설정 | `/etc/nginx/sites-available/dev.ericfromkorea.com` |
