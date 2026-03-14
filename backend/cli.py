from __future__ import annotations

from pathlib import Path
from typing import List, Optional

import typer

from core import merge_pdfs

app = typer.Typer(help="Spinacz – prosty łącznik plików PDF (CLI).")


def _parse_page_spec(spec: str, total_pages: int) -> List[int]:
    """
    Parsuje zapis stron typu '1-3,5,7-' do listy indeksów 0-based.
    """
    result: List[int] = []
    if not spec:
        return result

    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = int(start_str) if start_str else 1
            end = int(end_str) if end_str else total_pages
            for page in range(start, end + 1):
                if 1 <= page <= total_pages:
                    result.append(page - 1)
        else:
            page = int(part)
            if 1 <= page <= total_pages:
                result.append(page - 1)
    # Usunięcie duplikatów z zachowaniem kolejności
    seen = set()
    unique: List[int] = []
    for p in result:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique


@app.command()
def merge(
    files: List[Path] = typer.Argument(
        ...,
        exists=True,
        readable=True,
        help="Pliki PDF do scalenia w podanej kolejności.",
    ),
    output: Path = typer.Option(
        ...,
        "-o",
        "--output",
        help="Ścieżka do pliku wynikowego PDF.",
    ),
    pages: Optional[List[str]] = typer.Option(
        None,
        "--pages",
        help="Zakresy stron dla kolejnych plików, np. '1-3,5,7-'. "
        "Można podać wiele razy – raz na każdy plik.",
    ),
    blank_between: bool = typer.Option(
        False,
        "--blank-between",
        help="Dodaj pustą stronę między kolejnymi plikami.",
    ),
) -> None:
    """
    Scala podane pliki PDF w jeden dokument.
    """
    try:
        page_ranges = None
        if pages is not None:
            if len(pages) > len(files):
                raise ValueError(
                    "Podano więcej zakresów stron (--pages) niż plików wejściowych."
                )
            # Dla prostoty, na razie nie znamy liczby stron z CLI – szczegółowe
            # przycinanie odbywa się w backendzie, więc tutaj przekazujemy
            # tylko surowe informacje; core i tak zweryfikuje indeksy.
            # Użyjemy dużej liczby stron jako górnego limitu.
            dummy_total = 10_000
            page_ranges = [
                _parse_page_spec(spec, dummy_total) for spec in pages
            ]

        merge_pdfs(
            files,
            output,
            page_ranges=page_ranges,
            blank_between=blank_between,
        )
    except FileExistsError as e:
        typer.secho(str(e), fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1)
    except (ValueError, FileNotFoundError) as e:
        typer.secho(str(e), fg=typer.colors.RED, err=True)
        raise typer.Exit(code=1)

    typer.secho(f"Zapisano scalony PDF: {output}", fg=typer.colors.GREEN)


def main() -> None:
    app()


if __name__ == "__main__":
    main()

