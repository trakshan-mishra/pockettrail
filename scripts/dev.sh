#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
if [ ! -d frontend/node_modules ]; then (cd frontend && npm ci); fi
npm run build --prefix frontend
exec .venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
