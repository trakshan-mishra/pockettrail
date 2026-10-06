# PocketTrail

A little less screen. A little more outside.

PocketTrail turns your time, setting, mood and outdoor conditions into three gentle nature activities. Save a walk on your device, then take a pause outdoors or by a window. Saved activity text works without a connection. Optional narration is available when ElevenLabs is configured.

Live demo: https://pockettrail-6dyu.onrender.com (free instance, so the first load after idle can take about a minute). The hosted demo runs in sample mode: it serves authored activities with no model calls and no voice. Model generation and narration need the configuration described below.

Created during the Hacktoberfest Week 1 2026 **Touch Grass** challenge. This repository covers Week 1 only.

## Run locally

Requires Node.js 24 and Python 3.13+.

```bash
cp .env.example .env
bash scripts/dev.sh
```

Open http://127.0.0.1:8000. The script builds the production frontend so offline caching can be tested locally. For interface development run the backend separately and use `npm run dev --prefix frontend` (offline caching is intentionally disabled in Vite development).

### Local open-weight inference

Install Ollama from its official site and download an appropriate model. The development machine already has `qwen2.5-coder:3b`; no new model download is required there.

```dotenv
MODEL_BACKEND=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:3b
```

This is a small coding-oriented model, used as a practical existing baseline rather than a claim of best task quality. See its [official model card and license](https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct). A different installed local model can be selected without changing the activity application. Local inference sends preferences only to your local Ollama server; hosted configurations send preferences to their provider.

### Backboard

Add the key only to the server `.env`. Use the [model catalog](https://docs.backboard.io/api-reference/models/list) to select an available open-weight model. Set the provider and exact model ID explicitly; never rely on the closed-model default.

```dotenv
MODEL_BACKEND=backboard
BACKBOARD_API_KEY=your-server-key
BACKBOARD_PROVIDER=the-provider-from-the-catalog
BACKBOARD_MODEL_NAME=the-exact-model-id
BACKBOARD_OPEN_WEIGHT_CONFIRMED=true
```

Set confirmation only after checking the selected model's official model card. No key enters the frontend bundle. Adding local `.env` settings takes effect on the next API request.

### ElevenLabs voice

Set `ELEVENLABS_API_KEY` and an accessible `ELEVENLABS_VOICE_ID`. The default model is `eleven_flash_v2_5`; confirm availability in your account and change it if needed. Clicking **Add voice** is the only action that generates narration. Reading, opening, or saving a pack does not spend voice credits. Audio is cached on the server and saved as blobs on the device.

### Sample activities

**Try a sample walk** selects original activities without a model call and is clearly labeled. It is a preview of the workflow, not a claim of AI inference or a contest-ready AI demo. `MODEL_BACKEND=preview` enables that mode for all generation.

## Context and timers

Choose **Daytime**, **Evening** or **Rainy**. The device clock defaults to Daytime from 6 AM to 6 PM, and Evening otherwise; this is an editable choice, not a weather forecast or sunrise calculation. Evening and rainy packs exclude daylight-only activities. Rainy instructions keep the user sheltered. **Window or balcony** uses a separate catalog that works indoors with the window closed. Moods are **Calm**, **Curious** and **Creative**.

In Walk Mode, **Try chime** previews a quiet two-note sound. Starting an activity timer enables the same sound at its end, plus vibration where the browser supports it. The chime is synthesized locally and uses no narration credits. Pausing or changing activities cancels the pending sound. Voice-generation controls stay hidden while narration is unconfigured; previously downloaded clips remain playable.

Keep the page active for timer cues. Phone browsers can suspend audio or timers when hidden or locked, and vibration support varies. This is a browser timer, so a physical phone check is needed before promising pocket or lock-screen reliability.

## Offline behavior

1. Load the production app online and wait for **Offline app ready**.
2. Save a walk. Add voice while connected if you want offline audio.
3. Disconnect and reload. Open **Saved walks**.

The app shell, fonts, activity packs and downloaded audio are saved locally. Generating a new pack or adding unsaved voice needs a connection. Browser storage is device-specific and may be cleared by the browser; export important field notes. There is no account sync.

## Credit controls

- Identical generation requests reuse persistent cached responses, without another model call.
- Every Backboard attempt, including a validation repair, reserves a usage slot atomically **before** contacting the provider. Only one validation repair is allowed. Network failures do not automatically retry.
- Global daily/lifetime model-call and narration-character quotas are stored in SQLite. Defaults are deliberately small. Failed provider requests retain their reserved quota to avoid undercounting potentially billed calls.
- Narration accepts a saved server pack/activity ID, not arbitrary text. Repeated narration reuses its cached audio.
- An hourly IP-based request limit adds protection. It is process-local, so deploy one application worker. Global credit quotas remain persistent.
- These are request and character ceilings, **not guaranteed dollar caps**. Check provider billing and pricing. Keep Week 1 Backboard spending within $1, Render within $5, and voice within 5% of your active monthly allocation. Keep Tinker unused for this project.

## Deployment preparation

The Dockerfile builds React and serves it with FastAPI. `render.yaml` describes one paid service and a 1 GB disk so quota/cache data survive restarts and deployments. Review current compute and disk charges before deploying. Without persistent storage, credit quotas would reset when the service is replaced. For a paid Render disk, verify that the mount is writable by the container's non-root runtime user before enabling provider calls.

Do not apply the blueprint until you have reviewed the $5 Week 1 hosting budget and approved publication. Fill environment secrets through Render, verify the open model selection, and keep the demo through judging within the reserve. The free-tier demo above was deployed without a disk, `MODEL_BACKEND=preview` and `RUNTIME_DIR=/tmp/pockettrail`; `render.yaml` describes the paid configuration with persistent quotas for hosted generation.

## How it works

React, TypeScript and IndexedDB handle setup, Walk Mode, voice playback, saved walks and field notes. FastAPI and Pydantic validate requests and model output. The model selects three distinct eligible catalog activities and adds a short personal focus. Authored instructions and the stationary introduction do not change, and the server allocates durations that add up exactly to the requested 10, 20 or 30 minutes.

Catalog settings and equipment exclusions are enforced before and after generation. Observational suggestions are checked for a small list of unsupported actions. That check is not a semantic guarantee; free-text constraints and model suggestions need manual evaluation before submission. No routes, species recognition, GPS, medical claims, accounts, streaks or social features are included.

## Submission evidence

See `docs/SUBMISSION-CHECKLIST.md` for the real outdoor trial, model comparison and article requirements. `docs/VERIFICATION.md` records completed checks and limitations; `docs/DEMO-SCRIPT.md` provides a recording sequence and field-trial sheet. Record actual results, and do not claim partner integration was verified until real calls succeeded.

Any commits after the challenge deadline must be identified here before presenting them as part of the submission.
