from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import List, Optional

from flask import Flask, jsonify, request, send_file

from core import merge_pdfs

app = Flask(__name__)


def _parse_page_spec(spec: str, max_pages_hint: int = 10_000) -> List[int]:
    """
    Parsuje zapis stron typu '1-3,5,7-' do listy indeksów 0-based.
    max_pages_hint służy tylko do ograniczenia górnej granicy.
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
            end = int(end_str) if end_str else max_pages_hint
            for page in range(start, end + 1):
                if 1 <= page <= max_pages_hint:
                    result.append(page - 1)
        else:
            page = int(part)
            if 1 <= page <= max_pages_hint:
                result.append(page - 1)

    seen = set()
    unique: List[int] = []
    for p in result:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique


@app.route("/api/merge", methods=["POST"])
def api_merge():
    """
    Przyjmuje pliki PDF (multipart/form-data) oraz opcje i zwraca scalony PDF.

    Oczekiwane pola formularza:
    - files: wiele plików PDF
    - blank_between: opcjonalny bool (\"true\"/\"false\")
    - pages: opcjonalnie wiele wpisów z zakresami stron, np. \"1-3,5,7-\"
             (kolejność odpowiada kolejności plików)
    """
    uploaded_files = request.files.getlist("files")
    if not uploaded_files:
        return jsonify({"error": "Nie przesłano żadnych plików."}), 400

    blank_between_flag = request.form.get("blank_between", "false").lower() == "true"
    pages_specs: Optional[List[str]] = request.form.getlist("pages") or None

    temp_paths: List[Path] = []
    try:
        for storage in uploaded_files:
            if not storage.filename or not storage.filename.lower().endswith(".pdf"):
                return (
                    jsonify({"error": f"Nieprawidłowy plik: {storage.filename}"}),
                    400,
                )

            tmp = NamedTemporaryFile(suffix=".pdf", delete=False)
            storage.save(tmp.name)
            tmp_path = Path(tmp.name)
            temp_paths.append(tmp_path)

        page_ranges = None
        if pages_specs is not None and len(pages_specs) > 0:
            if len(pages_specs) > len(temp_paths):
                return (
                    jsonify(
                        {
                            "error": "Podano więcej zakresów stron (pages) niż plików wejściowych."
                        }
                    ),
                    400,
                )
            page_ranges = [
                _parse_page_spec(spec) for spec in pages_specs
            ]

        with NamedTemporaryFile(suffix=".pdf", delete=False) as out_tmp:
            out_path = Path(out_tmp.name)

        merge_pdfs(
            temp_paths,
            out_path,
            page_ranges=page_ranges,
            blank_between=blank_between_flag,
        )

        return send_file(
            out_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="spinacz.pdf",
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


def main() -> None:
    app.run(host="0.0.0.0", port=5000, debug=True)


if __name__ == "__main__":
    main()

