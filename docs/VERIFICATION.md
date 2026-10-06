# Verification — October 6, 2026

## Slice 1 — on-device walk measurement

- Static type checking with no emitted files and a production build passed.
- A scripted check of the production measurement functions passed: prep elapsed time; hidden duration; two hidden-to-visible transitions; duplicate visibility events; forward/backward wall-clock changes; interrupted timing; resuming without adding reload gaps; and measurement export text.
- Backend code was unchanged. A scripted HTTP check confirmed the sample pack still returns three activities totaling ten minutes and rejects an unexpected measurement payload with 422. The app's measurement write path uses IndexedDB, with no new network call or analytics.
- Desktop browser flow: created a sample walk, started it, reloaded mid-walk and saw recovery with timing paused, resumed it, completed the three activities and saw one reload interruption in the summary. A separate temporary local fixture sent two simulated hidden intervals through the actual app's visibility handler and a duplicate visible event. The end summary counted exactly two screen checks and showed 2.01 hidden minutes (two synthetic minutes plus browser execution time). This is simulated test data, not an outdoor observation.
- Completed all three activities, saved a clearly labelled simulation field note, opened the normal app again and reopened that field note. The summary retained its numbers. The export link's text contains prep time, session length, screen checks, hidden minutes, completions and timing caveats. Actual file delivery was not retested.
- Walk Mode and summary layouts checked at 390 × 844 and 320 × 740, without horizontal overflow. Browser error/warning logs were empty. The temporary fixture is in ignored build output, not application source or the commit.
- No dependencies added. No secrets or environment files changed. No push, deployment or hosted settings change.

Still unverified: real phone page visibility and suspension behavior, locked-screen audio, vibration, physical offline operation, download delivery and a real outdoor trial. The measurement summary cannot establish a physical location or distinguish an OS-generated visibility event from a deliberate screen check.

## Requested review changes

Implemented in the approved order: context choice and authored evening/rain activities; local chime and optional vibration; a separate window/balcony catalog; hidden unconfigured narration controls; Calm, Curious and Creative moods. The 5-minute option was not added and the landing-page sections remain. The daytime clock default is 6 AM–6 PM; Evening applies otherwise, with a manual Rainy choice.

A production rebuild and a fresh, uncached `qwen2.5-coder:3b` generation passed after each change. Each generated pack was opened through the browser form using its cached request afterward. All five contained three distinct eligible activities and the requested total duration. These were local calls, not sponsor calls. Raw requests and outputs are in `REVIEW-CHANGES-RESULTS.json`.

| Change | Real request | Model latency |
| --- | --- | --- |
| 1 | evening / park / calm | 46.52 s |
| 2 | rainy / garden / explore | 35.37 s |
| 3 | evening / window / create | 24.70 s |
| 4 | rainy / window / calm | 20.23 s |
| 5 | evening / window / curious | 31.49 s |

The final catalog/schema check passed 108 combinations (three contexts × four settings × three moods × three durations). It also verified that evening/rain requests reject daylight-only shadow activities and window requests only accept the window catalog. The three removed API moods are rejected. Five existing temporary backend test groups passed after adaptation to the three moods, including quota, cache and mocked vendor behavior.

Timer verification covered scheduled tones, pause cancellation, leaving the scheduled sound intact at completion, preview, and vibration calls with browser API doubles. In the in-app browser, Try chime successfully unlocked Web Audio and a full three-minute timer reached zero with the completion notice. Starting/pausing and changing activities were exercised. Physical phone vibration, audio audibility and lock-screen reliability remain unverified; the interface notes that phones may suspend cues when locked.

The final real window/evening/Curious pack was saved, its three activities completed, and a clearly labeled browser-test field note saved. Its completion heading says “You took a little pause.” Narration controls are absent when the server reports voice unconfigured, while existing saved audio remains usable. Requested phone viewport checks at 390 × 844 and 320 × 740 had no horizontal overflow in the rendered content. Console error/warning logs were empty. Screenshot: `screenshots/review-planner.jpg` (Git-ignored).

Manual review still finds some generic or repeated focus lines from the small coding model. Context and eligibility are enforced, but these checks do not establish strong personalization quality. A final demo pack still needs human review.

Relevant showcase inspiration: [Nightjar Listening Room](https://developers.openai.com/showcase/nightjar-listening-room), specifically user-initiated audio previews. No assets, API integration or broader redesign were copied.

No deployments were made during this pass. Sponsor spending for this pass: **$0**.

## Initial build checks

- Production TypeScript and Vite build passed. JavaScript is about 256 KB before compression; fonts are self-hosted and cached for offline use.
- Python modules compile; five temporary backend test groups passed. They covered 45 sample combinations (three times × three settings × five interests), equipment filtering, strict request schemas, duplicate/unknown/unsupported model output, atomic quota reservations under concurrent requests, persistence, generation caching, one reserved repair attempt, no automatic HTTP retries, narration caching, unknown activity rejection, and missing-configuration behavior. Vendor HTTP calls in those tests were mocked.
- Reproduced an unclosed SQLite connection, then verified explicit close on transaction exit and re-ran the checks without database resource warnings. The test client emits a dependency deprecation warning; application requests completed successfully.
- Real local Ollama generation succeeded with `qwen2.5-coder:3b`. The final `pockettrail-2` prompt returned three distinct activities, a 20-minute total, and an authored stationary introduction in 32.25 seconds, with 856 reported tokens. Latency varies with warmup and machine load.
- In-app browser: sample pack, real pack, persistent cache reuse, saving, Walk Mode, timer, all three activity completions, field note save, collection reopening, and reload were exercised.
- Help dialog: initial focus, Shift+Tab wrap, Escape close, and phone accessible name were verified after fixes.
- Responsive views requested at 390 × 844 and 320 × 740; the rendered content had no horizontal overflow. Walk Mode and field-note screenshots were inspected. This is browser viewport testing, not physical phone testing.
- Server-unavailable offline check: stopped the application's own server, reloaded the previously cached production app, and reopened saved activities and field notes. The machine itself retained its network connection, so the browser's actual offline event/banner and physical airplane mode still need a phone check.
- Field-note export content contains all three completions and the saved reflection. A persistent download link exposes the correct text. The in-app browser's download-event and media-download tests timed out; actual file delivery must be checked in a normal browser/phone before the recorded demo.
- Docker built successfully with Node 24 and Python 3.13; the container served its health endpoint and sample API as UID 10001. A named-volume permission failure was reproduced and fixed by preparing `/var/data` with the runtime user's ownership. Quota data persisted across two separate container runs. The final command forwards shutdown signals using `exec`.
- The frontend production dependency audit reported zero known vulnerabilities at test time. `.env`, runtime storage, build output and screenshots are Git-ignored. No credentials are placed in the frontend.

## Local model pilot

Three identical preference cases per installed model used the first prompt. Both returned 3/3 structurally accepted packs, including any permitted validation repairs. Mean latency: Qwen 29.80 seconds; Phi 67.35 seconds. This small local pilot is not a quality benchmark or a hosted-provider cost comparison. The installed Phi variant has a 128K model context; both calls used a 4K runtime context. Digests, quantization, preferences and raw outputs are in `LOCAL-MODEL-RESULTS.json`.

Manual review found two problems that structural checks missed: Qwen suggested a stroll in its introduction despite stationary preferences; Phi claimed heartbeat synchronization in a focus. The final application uses authored introductory text and rejects those heartbeat suggestions. A fresh Qwen call passed the revised prompt. Other unsupported wording can still escape a keyword check; inspect the chosen demonstration pack manually.

Model references: [Qwen's official card](https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct), [Microsoft's Phi-3 128K card](https://huggingface.co/microsoft/Phi-3-mini-128k-instruct).

## Pending evidence

- Real Backboard and ElevenLabs calls: local configuration still reports Ollama with voice unconfigured. Mocked contract checks do not prove live account permissions, hosted model availability, voice quality or actual paid usage.
- Actual downloaded audio playback, including offline playback, awaits live voice configuration.
- A larger hosted model comparison, actual provider billing, credit expiry/allocation details, outdoor trial, physical phone test and final demo recording.
- The public repository and hosted sample demo are described in README. This slice was tested locally only; hosted changes, persistent-disk behavior and the DEV submission remain outside this verification.

Sponsor credit use during these checks: **$0**. Tinker remains unused. Read `DEMO-SCRIPT.md` and `SUBMISSION-CHECKLIST.md` before presenting contest evidence.
