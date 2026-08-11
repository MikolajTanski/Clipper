# Jak postawić Spinacza — przewodnik krok po kroku

> Dla lajka, ale rozpisane tak, żebyś nie musiał zgadywać co się dzieje.  
> Zakładam, że chcesz **po prostu scalić PDF-y** — nie budować startupu.

---

## Spis

1. [Którą ścieżkę wybrać?](#którą-ścieżkę-wybrać)
2. [Ścieżka A — Docker (polecana, ~10 minut)](#ścieżka-a--docker-polecana)
3. [Ścieżka B — tylko terminal / CLI (~3 minuty)](#ścieżka-b--tylko-terminal--cli)
4. [Ścieżka C — dev bez Dockera (dla ciekawskich)](#ścieżka-c--dev-bez-dockera)
5. [Co dokładnie robi `docker compose up`](#co-dokładnie-robi-docker-compose-up)
6. [Codzienne używanie — start, stop, restart](#codzienne-używanie)
7. [Jak sprawdzić, że wszystko działa](#jak-sprawdzić-że-wszystko-działa)
8. [Co może pójść nie tak (i co z tym zrobić)](#co-może-pójść-nie-tak)
9. [FAQ](#faq)

---

## Którą ścieżkę wybrać?

| Chcesz… | Idź do |
|---------|--------|
| Interfejs w przeglądarce, drag & drop, podgląd | **[Ścieżka A — Docker](#ścieżka-a--docker-polecana)** |
| Szybko z terminala, bez UI, jednorazowo | **[Ścieżka B — CLI](#ścieżka-b--tylko-terminal--cli)** |
| Grzebać w kodzie frontu / backendu | **[Ścieżka C — dev](#ścieżka-c--dev-bez-dockera)** |

**90% przypadków:** Ścieżka A. Reszta to opcje na później.

---

## Ścieżka A — Docker (polecana)

### Krok 0 — Co musisz mieć

| Wymaganie | Po co |
|-----------|-------|
| **Docker Desktop** (albo Docker Engine + Compose na Linuksie) | Uruchamia dwa kontenery: front + backend |
| **Git** | Żeby sklonować repozytorium |
| **Przeglądarka** | Chrome, Firefox, Safari — cokolwiek |
| **~500 MB wolnego miejsca** | Obrazy Docker + build frontu |

Nie potrzebujesz: Pythona, Node.js, konta GitHub, chmury, kluczy API.

---

### Krok 1 — Zainstaluj Docker

#### macOS

1. Wejdź na [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Pobierz **Docker Desktop for Mac** (Apple Silicon albo Intel — zależy od Maca)
3. Otwórz `.dmg`, przeciągnij Docker do Applications
4. Uruchom Docker Desktop — poczekaj, aż w pasku menu wieloryb przestanie „migać"
5. W terminalu sprawdź:

```bash
docker --version
docker compose version
```

**Oczekiwany wynik** (wersje mogą być inne, ważne że nie ma błędu):

```
Docker version 27.x.x, build ...
Docker Compose version v2.x.x
```

#### Windows

1. Pobierz Docker Desktop for Windows
2. Zainstaluj (WSL 2 — Docker poprosi o włączenie, jeśli trzeba)
3. Uruchom Docker Desktop
4. Otwórz **PowerShell** lub **Git Bash** i sprawdź `docker --version`

#### Linux (Ubuntu / Debian — skrót)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# wyloguj się i zaloguj ponownie
docker --version
```

---

### Krok 2 — Sklonuj repozytorium

Otwórz terminal i wybierz folder, gdzie trzymasz projekty:

```bash
cd ~/Desktop
# albo: cd ~/Projects, cd ~/dev — gdzie wolisz
```

Sklonuj:

```bash
git clone https://github.com/MikolajTanski/Clipper.git
cd Clipper
```

**Co masz teraz na dysku:**

```
Clipper/
├── backend/          ← Python, Flask, logika scalania
├── frontend/         ← React, UI
├── docs/             ← dokumentacja
├── docker-compose.yml ← „przepis" na uruchomienie obu serwisów
└── README.md
```

Sprawdź, że jesteś we właściwym miejscu:

```bash
ls docker-compose.yml
# powinno wypisać: docker-compose.yml
```

---

### Krok 3 — Pierwsze uruchomienie (build + start)

W katalogu `Clipper/`:

```bash
docker compose up --build -d
```

**Co oznaczają flagi:**

| Flaga | Znaczenie |
|-------|-----------|
| `up` | Uruchom serwisy z `docker-compose.yml` |
| `--build` | Zbuduj obrazy od zera (potrzebne przy pierwszym razie i po zmianach w kodzie) |
| `-d` | Detached — działa w tle, terminal zostaje wolny |

**Pierwszy raz trwa 2–5 minut** (zależy od internetu i CPU). Docker:

1. Pobiera bazowy obraz Pythona 3.13
2. Instaluje `pypdf`, `flask`, `typer` w backendzie
3. Pobiera Node 20, robi `npm ci` i `npm run build` frontu
4. Pakuje zbudowany front do Nginx
5. Odpala oba kontenery

**Oczekiwany koniec logów** (przy `-d` możesz zobaczyć krótki output):

```
[+] Running 3/3
 ✔ Network clipper_default      Created
 ✔ Container clipper-backend-1  Started
 ✔ Container clipper-frontend-1 Started
```

Sprawdź status:

```bash
docker compose ps
```

**Powinno być:**

```
NAME                   STATUS          PORTS
clipper-backend-1      Up ...          0.0.0.0:5050->5000/tcp
clipper-frontend-1     Up ...          0.0.0.0:8080->80/tcp
```

Oba kontenery w stanie **Up**. Jeśli **Exit** albo **Restarting** — patrz [sekcja problemów](#co-może-pójść-nie-tak).

---

### Krok 4 — Otwórz aplikację

W przeglądarce:

**[http://localhost:8080](http://localhost:8080)**

Powinieneś zobaczyć ciemny ekran Spinacza z napisem „Spinacz" i strefą drag & drop.

| Adres | Co to |
|-------|-------|
| `http://localhost:8080` | **Aplikacja** — tu scalasz PDF-y |
| `http://localhost:5050/api/merge` | Backend API (bez UI) — do `curl` / skryptów |

---

### Krok 5 — Pierwsze scalenie (test na żywo)

1. Przygotuj **2 dowolne pliki PDF** (np. dwa slajdy, dwie strony z wydruku)
2. Przeciągnij je na strefę „Upuść pliki PDF tutaj"
3. Po prawej zobaczysz listę — kolejność = kolejność w wyniku
4. Po lewej pojawią się miniatury (może chwilę potrwać)
5. Kliknij **Scal PDF**
6. Przeglądarka pobierze **`spinacz.pdf`**
7. Otwórz `spinacz.pdf` — powinien zawierać strony z obu plików w wybranej kolejności

**Gratulacje — Spinacz stoi u Ciebie lokalnie.**

---

## Ścieżka B — tylko terminal / CLI

Najszybsza opcja, jeśli nie potrzebujesz przeglądarki — np. skrypt albo jednorazowe scalenie na serwerze.

### Wymagania

- Python **3.11+** (sprawdź: `python3 --version`)

### Kroki

```bash
git clone https://github.com/MikolajTanski/Clipper.git
cd Clipper/backend

# opcjonalnie, ale zalecane — izolowane środowisko
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

Scal pliki:

```bash
python merge.py pierwszy.pdf drugi.pdf trzeci.pdf -o wynik.pdf
```

Z pustą stroną między plikami:

```bash
python merge.py a.pdf b.pdf -o wynik.pdf --blank-between
```

Tylko wybrane strony (np. z pierwszego pliku strony 1–3, z drugiego reszta):

```bash
python merge.py a.pdf b.pdf -o wynik.pdf --pages "1-3" --pages "1-"
```

**Wynik:** plik `wynik.pdf` w bieżącym katalogu. Żaden Docker, żaden Nginx, zero portów.

---

## Ścieżka C — dev bez Dockera

Dla osób, które chcą edytować UI albo API i widzieć zmiany na żywo.

### Terminal 1 — backend

```bash
cd Clipper/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python web.py
```

Backend: **http://127.0.0.1:5000**

### Terminal 2 — frontend

```bash
cd Clipper/frontend
npm ci
npm run dev
```

Frontend: **http://localhost:5173**

### Proxy (ważne!)

Frontend domyślnie woła `/api/merge`. Vite **nie ma** proxy — dodaj do `frontend/vite.config.mts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

Zrestartuj `npm run dev`. Teraz UI na `:5173` gada z backendem na `:5000`.

Więcej szczegółów: [development.md](development.md).

---

## Co dokładnie robi `docker compose up`

Kiedy odpalasz Spinacza przez Docker, dzieją się trzy rzeczy naraz:

```
Ty (terminal)
    │
    ▼
docker compose up
    │
    ├──► BUILD backend
    │       python:3.13-slim
    │       pip install pypdf flask typer
    │       CMD: python web.py  →  nasłuchuje :5000 w kontenerze
    │
    └──► BUILD frontend
            node:20 → npm ci → npm run build → dist/
            nginx:1.27 → serwuje dist/ + proxy /api → backend:5000
            nasłuchuje :80 w kontenerze
    │
    ▼
Porty na Twoim komputerze:
    localhost:8080  →  frontend (Nginx)
    localhost:5050  →  backend (Flask) — opcjonalnie, do testów API
```

**Przepływ przy kliknięciu „Scal PDF":**

1. Przeglądarka wysyła pliki na `http://localhost:8080/api/merge`
2. Nginx w kontenerze frontu przekazuje to do `http://backend:5000/api/merge` (sieć Docker)
3. Flask zapisuje pliki tymczasowo, woła `merge_pdfs()` z `core.py`
4. pypdf scala PDF-y → zwraca `spinacz.pdf`
5. Nginx oddaje plik do przeglądarki

**Pliki nie wychodzą na internet** — wszystko krąży między Twoją przeglądarką a kontenerami na Twoim dysku.

---

## Codzienne używanie

### Włączenie (kolejny raz, bez rebuild)

Jeśli nic nie zmieniałeś w kodzie:

```bash
cd Clipper
docker compose up -d
```

Bez `--build` — start trwa kilka sekund.

### Wyłączenie

```bash
docker compose down
```

Kontenery znikają, **obrazy zostają** — następny `up` będzie szybki.

### Restart po zmianach w kodzie

```bash
docker compose down
docker compose up --build -d
```

### Logi (gdy coś nie działa)

```bash
# wszystko
docker compose logs -f

# tylko backend
docker compose logs -f backend

# tylko frontend
docker compose logs -f frontend
```

Wyjdź z logów: `Ctrl+C`.

### Usunięcie wszystkiego (obrazy + kontenery)

```bash
docker compose down --rmi local
```

Spinacz zniknie z Dockera; folder `Clipper/` na dysku zostaje.

---

## Jak sprawdzić, że wszystko działa

### 1. Kontenery żyją

```bash
docker compose ps
```

Oba **Up**.

### 2. Frontend odpowiada

```bash
curl -I http://localhost:8080
```

Oczekiwane: `HTTP/1.1 200 OK`

### 3. API scala (test bez przeglądarki)

```bash
curl -X POST http://localhost:8080/api/merge \
  -F "files=@/ścieżka/do/plik1.pdf" \
  -F "files=@/ścieżka/do/plik2.pdf" \
  -o test-spinacz.pdf
```

Otwórz `test-spinacz.pdf` — powinien być poprawny PDF.

### 4. UI end-to-end

- Dodaj 2 PDF-y → podgląd po lewej → Scal → pobierz → otwórz w Preview/Adobe.

---

## Co może pójść nie tak

### `docker: command not found`

Docker nie jest zainstalowany albo nie działa. Uruchom **Docker Desktop** i poczekaj na pełny start.

---

### `port is already allocated` / `Bind for 0.0.0.0:8080 failed`

Port **8080** albo **5050** zajęty przez inną aplikację.

**Opcja 1** — znajdź co siedzi na porcie (macOS/Linux):

```bash
lsof -i :8080
lsof -i :5050
```

Zabij proces albo zatrzymaj inną aplikację.

**Opcja 2** — zmień porty w `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "5051:5000"    # było 5050
  frontend:
    ports:
      - "8081:80"      # było 8080
```

Potem: `docker compose up --build -d` i wchodź na **http://localhost:8081**.

---

### Kontener `backend` w stanie Exit / Restarting

```bash
docker compose logs backend
```

Typowe przyczyny:
- brak miejsca na dysku
- błąd w `requirements.txt` (rzadko)

Spróbuj:

```bash
docker compose down
docker compose build --no-cache backend
docker compose up -d
```

---

### Kontener `frontend` pada przy buildzie

```bash
docker compose logs frontend
```

Często: problem z `npm ci` (sieć) albo brak pamięci RAM przy buildzie Vite.

```bash
docker compose build --no-cache frontend
docker compose up -d
```

---

### Strona się ładuje, ale „Błąd połączenia" przy scalaniu

Backend nie żyje albo Nginx nie dociera do backendu.

```bash
docker compose ps
docker compose logs backend
```

Backend musi być **Up**. Jeśli front wstał przed backendem — restart:

```bash
docker compose restart
```

---

### 413 Request Entity Too Large

PDF-y łącznie ważą więcej niż **500 MB** (limit w `frontend/nginx.conf`).

**Szybkie obejście:** użyj CLI ([Ścieżka B](#ścieżka-b--tylko-terminal--cli)) — omija Nginx.

**Trwałe:** w `frontend/nginx.conf` zwiększ `client_max_body_size`, potem `docker compose up --build -d`.

---

### Scalanie trwa bardzo długo / timeout

Duże pliki + wolny dysk. Limit timeoutu to **300 s** w nginx.

Obniż rozmiar plików albo użyj CLI.

---

### Pusty podgląd miniaturek (ale scalanie działa)

Worker pdf.js nie został skopiowany — dotyczy głównie dev bez Dockera:

```bash
cd frontend
npm run prebuild
npm run dev
```

W Dockerze build robi to automatycznie przy `npm run build`.

---

### `git clone` nie działa

Sprawdź internet albo pobierz ZIP z GitHub: **Code → Download ZIP**, rozpakuj, wejdź do folderu.

---

## FAQ

### Czy muszę mieć internet po zbudowaniu?

**Nie** — po pierwszym `docker compose up --build` Spinacz działa offline. Internet potrzebny tylko do klonowania repo i pierwszego pobrania obrazów Docker.

### Czy moje PDF-y lecą gdzieś na serwer?

**Nie.** Przetwarzanie jest lokalne — na Twoim komputerze, w kontenerach Docker. Nikt inny ich nie widzi (o ile sam nie wystawisz portu 8080 w sieci publicznej).

### Czy mogę postawić to na serwerze VPS?

Tak — sklonuj repo, `docker compose up --build -d`, otwórz port 8080 w firewallu. **Uwaga:** bez autentykacji każdy w sieci mógłby wrzucać pliki — na produkcję dodaj reverse proxy z auth albo trzymaj za VPN.

### Jak zaktualizować do nowszej wersji?

```bash
cd Clipper
git pull
docker compose down
docker compose up --build -d
```

### Jak odinstalować?

```bash
cd Clipper
docker compose down --rmi local
cd ..
rm -rf Clipper   # opcjonalnie — usuwa kod z dysku
```

---

## Powrót do spisu treści

← [Dokumentacja](README.md) · [Użycie po postawieniu →](usage.md) · [Architektura →](architecture.md)
