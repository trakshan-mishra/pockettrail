"""Durable caching and atomic usage reservations, including failed paid calls."""
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from fastapi import HTTPException


class Store:
    def __init__(self, directory: Path):
        directory.mkdir(parents=True, exist_ok=True)
        self.directory = directory
        self.path = directory / "pockettrail.sqlite"
        with self.connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, data TEXT NOT NULL)")
            db.execute("CREATE TABLE IF NOT EXISTS packs (id TEXT PRIMARY KEY, data TEXT NOT NULL)")
            db.execute("CREATE TABLE IF NOT EXISTS usage (kind TEXT, period TEXT, value INTEGER NOT NULL, PRIMARY KEY(kind, period))")

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=15)
        try:
            with db:
                yield db
        finally:
            db.close()

    def get(self, key):
        with self.connect() as db:
            row = db.execute("SELECT data FROM cache WHERE key=?", (key,)).fetchone()
        return json.loads(row[0]) if row else None

    def put(self, key, data):
        with self.connect() as db:
            db.execute("INSERT OR REPLACE INTO cache VALUES (?,?)", (key, json.dumps(data)))
            db.execute("INSERT OR REPLACE INTO packs VALUES (?,?)", (data["id"], json.dumps(data)))

    def pack(self, pack_id):
        with self.connect() as db:
            row = db.execute("SELECT data FROM packs WHERE id=?", (pack_id,)).fetchone()
        if not row:
            raise HTTPException(404, "This activity pack is no longer on the server. Generate it again before adding voice.")
        return json.loads(row[0])

    def reserve(self, kind, amount, daily, total):
        today = datetime.now(timezone.utc).date().isoformat()
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            for period, cap in ((today, daily), ("total", total)):
                row = db.execute("SELECT value FROM usage WHERE kind=? AND period=?", (kind, period)).fetchone()
                current = row[0] if row else 0
                if current + amount > cap:
                    raise HTTPException(429, "The demo's usage allowance has been reached. Saved packs and sample activities still work.")
            for period in (today, "total"):
                db.execute("INSERT INTO usage VALUES (?,?,?) ON CONFLICT(kind,period) DO UPDATE SET value=value+excluded.value", (kind, period, amount))

    def totals(self):
        with self.connect() as db:
            return dict(db.execute("SELECT kind,value FROM usage WHERE period='total'").fetchall())
