# Rozwój lokalny

Jak uruchomić Spinacza bez Dockera, gdzie co leży i na co uważać przy developmencie.

---

## Struktura projektu

```
Clipper/
├── README.md                 # Landing — szybki start, linki do docs
├── docker-compose.yml        # Produkcja / demo: frontend + backend
├── docs/
│   ├── README.md             # Hub dokumentacji (spis treści)
│   ├── architecture.md
│   ├── usage.md
│   ├── development.md        # ← ten plik
│   └── assets/               # Grafiki (banner, diagramy SVG)
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt      # pypdf, flask, typer
│   ├── core.py               # merge_pdfs() — wspólna logika
│   ├── web.py                # Flask API
│   ├── cli.py                # Typer CLI
│   └── merge.py              # python merge.py ...
└── frontend/
    ├── Dockerfile            # Node build → Nginx
    ├── nginx.conf            # Produkcja: SPA + proxy /api
    ├── vite.config.mts
    ├── package.json
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── styles.css
        └── components/
            ├── FileDropzone.tsx
            ├── FileList.tsx
            └── DocumentPreview.tsx
```

---

## Wymagania

| Narzędzie | Wersja |
|-----------|--------|
| Python | 3.11+ (Docker: 3.13) |
| Node.js | 20+ |
| Docker + Compose | opcjonalnie, zalecane do pełnego stacku |

---

## Uruchomienie z Docker Compose (zalecane)

```bash
docker compose up --build
# lub w tle:
docker compose up --build -d
```

| Usługa | URL |
|--------|-----|
| Web UI | http://localhost:8080 |
| API (host) | http://localhost:5050/api/merge |

Logi:

```bash
docker compose logs -f
docker compose logs -f backend
```

Rebuild po zmianach:

```bash
docker compose up --build
```

---

## Uruchomienie bez Dockera

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python web.py
```

Backend nasłuchuje na **http://127.0.0.1:5000**.

Test API:

```bash
curl -X POST http://127.0.0.1:5000/api/merge \
  -F "files=@test1.pdf" \
  -F "files=@test2.pdf" \
  -o test-out.pdf
```

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Dev server: **http://localhost:5173**.

#### Proxy do backendu (ważne!)

Domyślnie frontend woła `/api/merge` (ścieżka względna). Vite **nie ma** skonfigurowanego proxy — bez Dockera musisz:

**Opcja A — dodać proxy w `vite.config.mts`:**

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:5000",
    },
  },
});
```

**Opcja B — tymczasowo zmienić URL w `App.tsx`:**

```typescript
const API_URL = "http://127.0.0.1:5000/api/merge";
```

*(Pamiętaj o CORS — Flask w dev może wymagać `flask-cors` lub proxy z opcji A.)*

### CLI (bez serwera)

```bash
cd backend
pip install -r requirements.txt
python merge.py plik1.pdf plik2.pdf -o wynik.pdf
```

---

## Build produkcyjny frontu

```bash
cd frontend
npm ci
npm run build    # wynik w dist/
```

Obraz Docker robi to automatycznie i serwuje przez Nginx.

---

## Gdzie wprowadzać zmiany

| Chcesz… | Edytuj |
|---------|--------|
| Logikę scalania (strony, blank page) | `backend/core.py` |
| Nowe opcje API | `backend/web.py` + ewentualnie `core.py` |
| Opcje CLI | `backend/cli.py` |
| UI / UX | `frontend/src/App.tsx`, komponenty, `styles.css` |
| Limity uploadu / timeout | `frontend/nginx.conf` |
| Porty Docker | `docker-compose.yml` |

---

## pdf.js (podgląd miniaturek)

Worker pdf.js jest kopiowany do `public/` przy `npm run prebuild` / `npm run build`.  
Jeśli podgląd nie działa lokalnie:

```bash
cd frontend
npm run prebuild
npm run dev
```

---

## Debugowanie typowych problemów

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| „Błąd połączenia" w UI | Brak proxy / backend nie działa | Uruchom backend, dodaj proxy Vite |
| 413 Request Entity Too Large | Plik > 500 MB | Zwiększ `client_max_body_size` w nginx.conf |
| Timeout przy dużym PDF | `proxy_read_timeout` | Zwiększ w nginx.conf lub użyj CLI |
| Pusty podgląd | Brak workera pdf.js | `npm run prebuild` |
| API zwraca 400 | Nie-PDF w uploadzie | Tylko pliki `.pdf` |

---

## Rozszerzenia (pomysły na PR)

- Wybór zakresów stron w Web UI (logika już jest w API/CLI)
- Cleanup plików tymczasowych po `send_file`
- Progress scalania po stronie serwera (SSE / WebSocket)
- Obsługa PDF-ów z hasłem
- Testy jednostkowe dla `core.py` i `_parse_page_spec`

---

## Powrót do spisu treści

← [Użycie i przykłady](usage.md) · [Dokumentacja](README.md)
