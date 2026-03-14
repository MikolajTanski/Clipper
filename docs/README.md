## Spinacz – prosty łącznik PDF

**Spinacz** to małe narzędzie do lokalnego łączenia plików PDF:
- **Zero AI, zero zewnętrznych API** – wszystko działa lokalnie.
- **CLI** do szybkiej pracy z terminala.
- Nowoczesny **Web UI (Flask + React + Nginx)** z drag & drop.

### Funkcje

- **Backend / CLI (Python)**:
  - Komenda:
    - `python backend/merge.py plik1.pdf plik2.pdf plik3.pdf -o wynik.pdf`
  - Łączenie PDF-ów w podanej kolejności.
  - Opcje:
    - zakresy stron (`--pages "1-3,5,7-"`),
    - pusta strona między plikami (`--blank-between`).

- **API HTTP (Flask)**:
  - Endpoint `POST /api/merge`:
    - przyjmuje pliki jako `multipart/form-data` (`files`),
    - opcja: `blank_between`,
    - zwraca scalony PDF `spinacz.pdf`.

- **Web UI (React + Nginx)**:
  - Ciemny, czarno-zielony motyw inspirowany spinaczem.
  - Drag & drop PDF-ów, lista plików z możliwością zmiany kolejności.
  - Podgląd „zszytego” dokumentu po lewej.
  - Przycisk „Scal PDF”, wynik pobierany bezpośrednio z przeglądarki.

### Stack technologiczny

- **Backend**:
  - Python
  - pypdf
  - CLI (Typer)
  - API HTTP (Flask)
- **Frontend**:
  - React + Vite
  - Nginx (serwowanie frontu + proxy `/api` do backendu)

### Uruchomienie (Docker Compose)

W katalogu głównym projektu:

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend (API): `http://localhost:5000/api/merge` (za Nginxem dostępne jako `/api/merge` z frontu).

