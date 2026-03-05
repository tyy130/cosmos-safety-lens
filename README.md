# Cosmos Safety Lens

Physical AI reasoning for dashcam footage — powered by **NVIDIA Cosmos Reason 2 (8B)**.

## What It Does

Upload any dashcam video URL and get chain-of-thought physical reasoning about every safety event:

- **Near-miss detection** with trajectory analysis
- **Pedestrian risk** assessment
- **Hazard identification** with physical causation explained

The `<think>` reasoning trace from Cosmos Reason 2 is surfaced directly in the UI — showing *why* an event is dangerous, not just that it was detected.

## Quick Start

### Prerequisites
- Node.js 22+
- NVIDIA NGC API key (free at [build.nvidia.com](https://build.nvidia.com))

### Run locally

```bash
# Backend
cd api
cp .env.example .env   # add your NVIDIA_API_KEY
npm install
npm run dev            # starts on :3001

# Frontend (new terminal)
cd dashboard
npm install
npm run dev            # starts on :5173
```

Open [http://localhost:5173](http://localhost:5173) — click a demo clip or paste any dashcam video URL.

## Contest-Compliant Runtime Notes

This submission is pinned to **NVIDIA Cosmos Reason 2**.

- `NVIDIA_MODEL` defaults to `nvidia/cosmos-reason2-8b`
- `NVIDIA_API_BASE` defaults to `https://integrate.api.nvidia.com/v1`
- If hosted integrate access is unavailable for your account, point `NVIDIA_API_BASE` to your own/self-hosted NIM endpoint that serves Cosmos Reason 2.

Use diagnostics to confirm entitlement and endpoint wiring:

```bash
curl http://localhost:3001/diag/models
curl http://localhost:3001/diag/callable
```

Best-practice note: `/models` visibility alone is not enough. Always verify callable status using `/diag/callable` before demoing.

References:
- Cosmos Reason2 API examples: https://docs.nvidia.com/nim/vision-language-models/1.6.0/examples/cosmos-reason2/api.html
- NVIDIA forum thread on function mapping/404 behavior: https://forums.developer.nvidia.com/t/function-not-found-for-account/357670

## Architecture

```
[Video URL] → POST /analyze → NVIDIA NIM (cosmos-reason2-8b) → parse reasoning → structured events
```

Safety events are overlaid on the video timeline as clickable markers. Clicking a marker reveals the full physical reasoning chain — the chain of thought Cosmos Reason 2 used to identify the danger.

## Demo Clips

Pre-loaded clips come from the [Nexar Collision Prediction Dataset](https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction) — 1,500 real dashcam clips, 50% collision/near-collision events.

## Demo Video

2m10s walkthrough video (submission-ready):

- [`demo/cosmos-safety-lens-demo.mp4`](./demo/cosmos-safety-lens-demo.mp4)

## Deploy

- **Frontend**: Vercel (`vercel --prod` from `/dashboard`)
- **Backend**: Railway (`railway up` from `/api`)

Set `VITE_API_URL` in Vercel environment variables to your Railway API URL.
Set `CORS_ORIGIN` in Railway to your Vercel frontend URL.

## Built With

- [NVIDIA Cosmos Reason 2](https://build.nvidia.com/nvidia/cosmos-reason2-8b) — physical AI reasoning model
- [NVIDIA NIM](https://build.nvidia.com) — hosted inference API
- React 18 + TypeScript + Vite
- Node.js 22 + Express + TypeScript

---

*NVIDIA Cosmos Cookoff 2026 submission — TacticDev*
