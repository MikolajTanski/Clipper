# Spinacz — dokumentacja

> **Spinacz** powstał, bo na studiach irytowało mnie łączenie PDF-ów przed oddaniem prac — szukanie narzędzi online, limity, reklamy, wysyłanie cudzych dokumentów na serwer.  
> Zrobiłem coś prostego, lokalnego i darmowego. **Macie to, korzystajcie jak chcecie.**

---

## Spis treści

Wybierz sekcję — każda to osobna „zakładka” dokumentacji:

| | Sekcja | Co znajdziesz |
|---|--------|---------------|
| 🚀 | [**Jak postawić (setup)**](setup.md) | Bardzo rozpisany przewodnik: Docker, CLI, dev, troubleshooting |
| 🏗 | [**Architektura**](architecture.md) | Warstwy systemu, przepływ danych, Docker, diagramy Mermaid |
| 📖 | [**Użycie i przykłady**](usage.md) | Web UI krok po kroku, CLI, API HTTP z przykładami |
| 🛠 | [**Rozwój lokalny**](development.md) | Dev bez Dockera, struktura katalogów, debugowanie |

---

## Szybki start (Docker)

```bash
# w katalogu głównym repozytorium
docker compose up --build -d
```

| Usługa | URL |
|--------|-----|
| **Aplikacja (Web UI)** | [http://localhost:8080](http://localhost:8080) |
| **API (bezpośrednio)** | `POST http://localhost:5050/api/merge` |
| **API (przez Nginx)** | `POST http://localhost:8080/api/merge` |

Zatrzymanie:

```bash
docker compose down
```

---

## Czym jest Spinacz?

**Spinacz** (ang. *paper clip*) to lokalny łącznik plików PDF. Nie dzieli PDF-ów — **scala** je w jeden dokument w wybranej kolejności.

### Trzy sposoby użycia

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web UI    │     │  HTTP API   │     │     CLI     │
│  przegląd.  │     │   skrypty   │     │  terminal   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │  core.merge_pdfs │
                  │     (pypdf)      │
                  └─────────────────┘
```

### Zasady projektu

- **Lokalnie** — pliki przetwarzane na Twojej maszynie
- **Prosto** — jeden endpoint API, jedna funkcja scalania
- **Bez magii** — zero AI, zero zewnętrznych API, zero kont użytkownika
- **Otwarte** — używaj, modyfikuj, rozwijaj

Na studiach kilku znajomych z grupy też z tego korzystało i sobie chwaliło — mimo że daleko od idealu. Ważne było to, że **rozwiązywało problem biznesowy**: jeden PDF zamiast pięciu, bez szukania kolejnego narzędzia online.

---

## Grafiki

| Plik | Opis |
|------|------|
| [`assets/hero-banner.png`](assets/hero-banner.png) | Baner produktu (README) |
| [`assets/workflow.png`](assets/workflow.png) | Przepływ pracy w Web UI |
| [`assets/architecture.png`](assets/architecture.png) | Diagram architektury |
| [`assets/workflow.svg`](assets/workflow.svg) | Wersja wektorowa (workflow) |
| [`assets/architecture.svg`](assets/architecture.svg) | Wersja wektorowa (architektura) |
| [`assets/setup-paths.png`](assets/setup-paths.png) | Wybor sciezki instalacji |
| [`assets/setup-docker-steps.png`](assets/setup-docker-steps.png) | Docker w 5 krokach |
| [`assets/setup-docker-flow.png`](assets/setup-docker-flow.png) | Co robi docker compose up |
| [`assets/setup-cli-flow.png`](assets/setup-cli-flow.png) | Sciezka CLI bez Dockera |

---

## Powrót

← [README główne](../README.md)
