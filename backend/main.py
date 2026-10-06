import asyncio
import hashlib
import json
import os
import time
import uuid
from collections import defaultdict, deque
from pathlib import Path
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .catalog import BY_ID
from .generation import PROMPT_VERSION, generate, model_config
from .models import MissionRequest, NarrationRequest
from .storage import Store

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
store = Store(ROOT / os.getenv("RUNTIME_DIR", ".runtime"))
generation_lock = asyncio.Lock()
voice_lock = asyncio.Lock()
rate_windows = defaultdict(deque)
app = FastAPI(title="PocketTrail", docs_url=None, redoc_url=None)


def refresh_config():
    # Lets a local developer add keys without restarting. On Render use env settings.
    load_dotenv(ROOT / ".env", override=True)


def limit(request):
    key = hashlib.sha256((request.client.host if request.client else "local").encode()).hexdigest()
    window = rate_windows[key]
    now = time.monotonic()
    while window and window[0] < now - 3600:
        window.popleft()
    if len(window) >= int(os.getenv("MAX_REQUESTS_PER_HOUR", "12")):
        raise HTTPException(429, "You've reached the demo's hourly allowance. You can still use saved packs and sample activities.")
    window.append(now)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/status")
def status():
    refresh_config()
    try:
        backend, model = model_config()
        ready = backend != "preview"
    except HTTPException:
        backend, model, ready = os.getenv("MODEL_BACKEND", "ollama"), "not configured", False
    return {"backend": backend, "model": model, "model_ready": ready, "voice_ready": bool(os.getenv("ELEVENLABS_API_KEY") and os.getenv("ELEVENLABS_VOICE_ID")), "usage": store.totals(), "limits": {"model_daily": int(os.getenv("MAX_MODEL_CALLS_PER_DAY", "20")), "model_total": int(os.getenv("MAX_MODEL_CALLS_TOTAL", "60")), "voice_daily": int(os.getenv("MAX_VOICE_CHARACTERS_PER_DAY", "3000")), "voice_total": int(os.getenv("MAX_VOICE_CHARACTERS_TOTAL", "10000"))}}


@app.post("/api/missions")
async def missions(preferences: MissionRequest, request: Request):
    refresh_config()
    backend, model = ("preview", "authored sample") if preferences.sample else model_config()
    key = hashlib.sha256(json.dumps({"v": PROMPT_VERSION, "request": preferences.model_dump(), "backend": backend, "model": model}, sort_keys=True).encode()).hexdigest()
    async with generation_lock:
        cached = store.get(key)
        if cached:
            return {**cached, "cached": True}
        if backend != "preview":
            limit(request)
        generated, backend, model, latency, tokens = await generate(preferences, store)
        base = preferences.minutes // 3
        durations = [base, base, preferences.minutes - base * 2]
        pack = {"id": uuid.uuid4().hex, "title": generated.title, "intro": ("Three things to notice from your window or sheltered balcony. Stay in your comfortable spot." if preferences.setting == "window" else {"daytime": "Three things to notice in the daylight, from one comfortable spot. Take them at your own pace.", "evening": "Three quiet things to notice as the day settles. Stay in one familiar, comfortable spot.", "rainy": "Three things to notice while the rain falls. Stay dry in a comfortable, sheltered spot."}[preferences.condition]), "minutes": preferences.minutes, "setting": preferences.setting, "interest": preferences.interest, "condition": preferences.condition, "activities": [{"id": a.activity_id, "title": BY_ID[a.activity_id].title, "instruction": BY_ID[a.activity_id].instruction, "focus": a.focus, "reflection": BY_ID[a.activity_id].prompt, "sense": BY_ID[a.activity_id].sense, "minutes": durations[i]} for i, a in enumerate(generated.activities)], "source": backend, "model": model, "latency_seconds": latency, "tokens": tokens, "cached": False}
        store.put(key, pack)
        return pack


@app.post("/api/narration")
async def narration(payload: NarrationRequest, request: Request):
    refresh_config()
    pack = store.pack(payload.pack_id)
    activity = next((a for a in pack["activities"] if a["id"] == payload.activity_id), None)
    if not activity:
        raise HTTPException(404, "That activity is not in this pack.")
    if not os.getenv("ELEVENLABS_API_KEY") or not os.getenv("ELEVENLABS_VOICE_ID"):
        raise HTTPException(503, "ElevenLabs voice is not configured yet. The activity text still works, including offline.")
    text = f'{activity["title"]}. {activity["instruction"]} Your focus: {activity["focus"]}'
    model = os.getenv("ELEVENLABS_MODEL_ID", "eleven_flash_v2_5")
    voice = os.environ["ELEVENLABS_VOICE_ID"]
    key = hashlib.sha256(json.dumps([text, voice, model]).encode()).hexdigest()
    audio_path = store.directory / (key + ".mp3")
    async with voice_lock:
        if not audio_path.exists():
            limit(request)
            store.reserve("voice_characters", len(text), int(os.getenv("MAX_VOICE_CHARACTERS_PER_DAY", "3000")), int(os.getenv("MAX_VOICE_CHARACTERS_TOTAL", "10000")))
            try:
                async with httpx.AsyncClient(timeout=45) as client:
                    response = await client.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}", params={"output_format": "mp3_44100_128"}, headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"]}, json={"text": text, "model_id": model})
                    response.raise_for_status()
                    if not response.content or len(response.content) > 2_000_000:
                        raise HTTPException(502, "The voice service returned an invalid audio clip.")
                    temporary = audio_path.with_suffix(".tmp")
                    temporary.write_bytes(response.content)
                    temporary.replace(audio_path)
            except httpx.HTTPError:
                raise HTTPException(502, "Voice could not be generated. No automatic paid retry was made. You can still read this activity.") from None
    return FileResponse(audio_path, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400"})


DIST = ROOT / "frontend" / "dist"
app.mount("/", StaticFiles(directory=DIST, html=True, check_dir=False), name="frontend")
