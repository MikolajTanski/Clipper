# Użycie i przykłady

Spinacz można używać na trzy sposoby: **Web UI** (najprostszy), **CLI** (terminal / automatyzacja) i **HTTP API** (skrypty, integracje).

---

## Web UI

### Uruchomienie

```bash
docker compose up --build -d
```

Otwórz [http://localhost:8080](http://localhost:8080).

### Krok po kroku

![Przepływ pracy](assets/workflow.svg)

1. **Dodaj pliki** — przeciągnij PDF-y na strefę drop lub kliknij, żeby wybrać z dysku
2. **Ułóż kolejność** — przeciągnij pozycje na liście „Kolejność plików"
3. **Sprawdź podgląd** — lewy panel pokazuje miniatury pierwszych stron w kolejności wyniku
4. **Opcje** — zaznacz „Dodaj pustą stronę między plikami", jeśli chcesz separator między dokumentami
5. **Scal PDF** — kliknij przycisk; pasek postępu pokazuje upload i scalanie
6. **Pobierz** — przeglądarka zapisze `spinacz.pdf`

### Typowy scenariusz (studia)

Masz trzy pliki: `wstep.pdf`, `rozwazania.pdf`, `zrodla.pdf` — chcesz jeden PDF do wgrania na platformę.

1. Dodaj wszystkie trzy pliki
2. Ułóż: wstęp → rozważania → źródła
3. Włącz pustą stronę między sekcjami (opcjonalnie)
4. Scal → gotowe

---

## CLI (terminal)

CLI jest przydatne w skryptach, aliasach shellowych i gdy nie potrzebujesz podglądu.

### Instalacja zależności

```bash
cd backend
pip install -r requirements.txt
```

### Podstawowe użycie

```bash
# Scal dwa pliki
python merge.py notatki.pdf slajdy.pdf -o calosc.pdf

# Scal trzy pliki w podanej kolejności
python merge.py a.pdf b.pdf c.pdf -o wynik.pdf
```

### Pusta strona między plikami

```bash
python merge.py rozdzial1.pdf rozdzial2.pdf -o ksiazka.pdf --blank-between
```

### Wybór zakresów stron

Składnia: `1-3,5,7-` (strony 1–3, potem 5, potem od 7 do końca).

```bash
# Z pierwszego pliku tylko strony 1–3, z drugiego wszystkie
python merge.py duzy.pdf krotki.pdf -o fragment.pdf --pages "1-3"

# Różne zakresy per plik (jeden --pages na plik, w kolejności plików)
python merge.py a.pdf b.pdf c.pdf -o out.pdf \
  --pages "1-5" \
  --pages "2,4,6" \
  --pages "1-"
```

### Przykład: alias w `.zshrc` / `.bashrc`

```bash
alias spinacz='python /ścieżka/do/Clipper/backend/merge.py'
spinacz *.pdf -o scalone.pdf
```

---

## HTTP API

Jeden endpoint: **`POST /api/merge`**

### Parametry (`multipart/form-data`)

| Pole | Typ | Wymagane | Opis |
|------|-----|:--------:|------|
| `files` | plik(i) PDF | ✅ | Pliki do scalenia, **w kolejności** |
| `blank_between` | `"true"` / `"false"` | — | Pusta strona między plikami (domyślnie `false`) |
| `pages` | string (wielokrotnie) | — | Zakres stron per plik, np. `"1-3,5,7-"` |

### Odpowiedź

| Status | Treść |
|--------|-------|
| `200` | Plik PDF (`Content-Disposition: attachment; filename=spinacz.pdf`) |
| `400` | JSON `{"error": "..."}` — brak plików, zły format, za dużo `pages` |
| `500` | JSON `{"error": "..."}` — błąd scalania |

---

### Przykład: `curl` — proste scalenie

```bash
curl -X POST http://localhost:8080/api/merge \
  -F "files=@/ścieżka/do/plik1.pdf" \
  -F "files=@/ścieżka/do/plik2.pdf" \
  -o spinacz.pdf
```

### Przykład: z pustą stroną

```bash
curl -X POST http://localhost:8080/api/merge \
  -F "files=@rozdzial1.pdf" \
  -F "files=@rozdzial2.pdf" \
  -F "blank_between=true" \
  -o spinacz.pdf
```

### Przykład: z zakresami stron

```bash
curl -X POST http://localhost:8080/api/merge \
  -F "files=@a.pdf" \
  -F "files=@b.pdf" \
  -F "pages=1-3,5" \
  -F "pages=2-" \
  -o spinacz.pdf
```

### Przykład: Python (`requests`)

```python
import requests

files = [
    ("files", ("czesc1.pdf", open("czesc1.pdf", "rb"), "application/pdf")),
    ("files", ("czesc2.pdf", open("czesc2.pdf", "rb"), "application/pdf")),
]
data = {"blank_between": "true"}

response = requests.post("http://localhost:8080/api/merge", files=files, data=data)
response.raise_for_status()

with open("spinacz.pdf", "wb") as f:
    f.write(response.content)
```

### Przykład: JavaScript (fetch)

```javascript
const formData = new FormData();
formData.append("files", file1);
formData.append("files", file2);
formData.append("blank_between", "false");

const response = await fetch("/api/merge", {
  method: "POST",
  body: formData,
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "spinacz.pdf";
a.click();
URL.revokeObjectURL(url);
```

*(Ten sam wzorzec używa Web UI w `App.tsx`.)*

---

## Składnia zakresów stron

| Zapis | Znaczenie |
|-------|-----------|
| `5` | Tylko strona 5 |
| `1-3` | Strony 1, 2, 3 |
| `7-` | Od strony 7 do końca dokumentu |
| `-3` | Od początku do strony 3 *(w API: `1-3`)* |
| `1-3,5,7-` | Kombinacja powyższych |

Numery stron są **1-based** (jak w czytnikach PDF). Duplikaty są usuwane z zachowaniem kolejności.

> **Uwaga:** Web UI na razie nie eksponuje wyboru stron — tylko CLI i API. W UI scalane są wszystkie strony każdego pliku.

---

## Limity

| Limit | Wartość |
|-------|---------|
| Max rozmiar uploadu (Nginx) | 500 MB |
| Timeout proxy | 300 s |
| Dozwolone typy plików | `.pdf` |

Przy bardzo dużych plikach użyj CLI zamiast przeglądarki — omijasz limit i timeout HTTP.

---

## Powrót do spisu treści

← [Architektura](architecture.md) · [Dokumentacja](README.md) · [Rozwój lokalny →](development.md)
