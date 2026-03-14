# Spinacz – PDF merger

A small **local** tool to merge PDF files. No AI, no external APIs – everything runs on your machine.

- **Web UI**: Dark green/black theme, drag & drop, file reorder, preview thumbnails, merge and download.
- **Backend**: Python (pypdf, Flask), HTTP API `POST /api/merge`.
- **Deploy**: Docker Compose (frontend on port 8080, backend on 5050).

## Features

- Merge multiple PDFs in a chosen order.
- Optional blank page between files.
- CLI available in the backend for terminal use.

## Tech stack

- **Backend**: Python 3, pypdf, Flask, Typer (CLI).
- **Frontend**: React, Vite, pdf.js for previews, Nginx (static + proxy to API).

## Run with Docker Compose

From the project root:

```bash
docker compose up --build -d
```

- **App**: [http://localhost:8080](http://localhost:8080)
- **API**: `POST http://localhost:5050/api/merge` (or `/api/merge` when using the app; Nginx proxies to the backend).

## Run locally (no Docker)

**Backend**

```bash
cd backend
pip install -r requirements.txt
python web.py
```

Runs on `http://127.0.0.1:5000`. For the UI to call it, either run the frontend with a proxy or set the API base URL in the frontend.

**Frontend**

```bash
cd frontend
npm ci
npm run dev
```

Runs on `http://localhost:5173`. Point the app at your backend (e.g. proxy in Vite or env).

## Project layout

- `backend/` – Flask app, `core.py` (merge logic), CLI in `merge.py`, `web.py` (API).
- `frontend/` – React + Vite app, Nginx config for production build.
- `docs/` – Extra docs (e.g. plan, Polish README).
- `docker-compose.yml` – Backend and frontend services.

## License

Use as you like.
