FROM python:3.12-alpine

WORKDIR /app

# Static portfolio + editor API. fe/ is also bind-mounted at runtime so edits persist.
COPY . .

EXPOSE 8000

CMD ["python", "server/server.py"]
