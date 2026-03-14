from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from pypdf import PageObject, PdfReader, PdfWriter


def _validate_pdf_path(pdf_path: Path) -> None:
    if not pdf_path.exists():
        raise FileNotFoundError(f"Plik nie istnieje: {pdf_path}")
    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError(f"Nieprawidłowe rozszerzenie (oczekiwano .pdf): {pdf_path}")


def merge_pdfs(
    input_files: Iterable[Path],
    output_file: Path,
    *,
    page_ranges: Sequence[Sequence[int]] | None = None,
    blank_between: bool = False,
) -> None:
    """
    Scala wiele plików PDF w jeden.

    :param input_files: ścieżki do plików wejściowych (w podanej kolejności)
    :param output_file: ścieżka do pliku wynikowego
    :param page_ranges: opcjonalne zakresy stron (lista list numerów stron 0-based)
    :param blank_between: jeżeli True, dodaje pustą stronę między plikami
    """
    paths = [Path(p) for p in input_files]
    if not paths:
        raise ValueError("Nie podano żadnych plików do scalenia.")

    writer = PdfWriter()

    for idx, pdf_path in enumerate(paths):
        _validate_pdf_path(pdf_path)

        reader = PdfReader(str(pdf_path))
        num_pages = len(reader.pages)

        if page_ranges is not None:
            if idx >= len(page_ranges):
                indices: Sequence[int] = range(num_pages)
            else:
                indices = [i for i in page_ranges[idx] if 0 <= i < num_pages]
                if not indices:
                    continue
        else:
            indices = range(num_pages)

        for i in indices:
            writer.add_page(reader.pages[i])

        if blank_between and idx < len(paths) - 1 and len(writer.pages) > 0:
            last_page: PageObject = writer.pages[-1]
            blank = PageObject.create_blank_page(
                width=last_page.mediabox.width,
                height=last_page.mediabox.height,
            )
            writer.add_page(blank)

    output_path = Path(output_file)
    with output_path.open("wb") as f:
        writer.write(f)

