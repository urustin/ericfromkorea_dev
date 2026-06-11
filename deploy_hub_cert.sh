#!/usr/bin/env bash
set -euo pipefail

SRC="/home/son/.acme.sh/hub.ericfromkorea.com_ecc"
DST="/etc/letsencrypt/live/hub.ericfromkorea.com"

sudo mkdir -p "$DST"
sudo cp "$SRC/hub.ericfromkorea.com.cer" "$DST/cert.pem"
sudo cp "$SRC/hub.ericfromkorea.com.key" "$DST/privkey.pem"
sudo cp "$SRC/fullchain.cer" "$DST/fullchain.pem"
sudo chmod 600 "$DST/privkey.pem"
sudo nginx -t
sudo systemctl reload nginx
