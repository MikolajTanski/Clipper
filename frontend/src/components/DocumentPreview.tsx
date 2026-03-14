import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

type SpinaczFile = {
  id: string;
  file: File;
};

type Props = {
  files: SpinaczFile[];
  /** loaded, total, currentFilePercent (0–100) dla pliku w trakcie ładowania */
  onProgress?: (loaded: number, total: number, currentFilePercent?: number) => void;
};

/** Worker w public/ – bez hashowania Vite, stabilna ścieżka w buildzie */
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/** Wartość w previews gdy ładowanie się nie udało */
const PREVIEW_ERROR = "error" as const;

export const DocumentPreview: React.FC<Props> = ({ files, onProgress }) => {
  const [previews, setPreviews] = useState<Record<string, string | null | typeof PREVIEW_ERROR>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const total = files.length;
    if (total === 0) {
      onProgress?.(0, 0);
      return;
    }

    const toProcess = files.filter((f) => previews[f.id] === undefined);
    let loaded = total - toProcess.length;

    const generatePreviews = async () => {
      if (loaded < total) onProgress?.(loaded, total, 0);
      for (const f of toProcess) {
        if (cancelled) return;
        try {
          onProgress?.(loaded, total, 10);
          const data = await f.file.arrayBuffer();
          if (cancelled) return;
          onProgress?.(loaded, total, 30);
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          if (cancelled) return;
          onProgress?.(loaded, total, 60);
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.25 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (!context) {
            loaded += 1;
            if (!cancelled) onProgress?.(loaded, total);
            continue;
          }

          onProgress?.(loaded, total, 85);
          await page.render({ canvasContext: context, viewport }).promise;
          if (cancelled) return;
          const url = canvas.toDataURL("image/png");

          if (!cancelled) {
            setPreviews((prev) => ({ ...prev, [f.id]: url }));
          }
          loaded += 1;
          if (!cancelled) onProgress?.(loaded, total);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("Błąd podglądu PDF:", f.file.name, err);
          if (!cancelled) {
            setPreviews((prev) => ({ ...prev, [f.id]: PREVIEW_ERROR }));
            setErrors((prev) => ({ ...prev, [f.id]: msg }));
          }
          loaded += 1;
          if (!cancelled) onProgress?.(loaded, total);
        }
      }
    };

    generatePreviews();

    return () => {
      cancelled = true;
    };
  }, [files]);

  if (!files.length) {
    return (
      <div className="doc-preview-empty">
        <div className="doc-preview-placeholder">
          <p>Dodaj pliki PDF, aby zobaczyć układ dokumentu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-preview">
      {files.map((f, index) => (
        <div key={f.id} className="doc-preview-doc">
          <div className="doc-preview-doc-header">
            <span className="doc-preview-badge">{index + 1}</span>
            <span className="doc-preview-name" title={f.file.name}>
              {f.file.name}
            </span>
          </div>
          <div className="doc-preview-pages">
            {previews[f.id] === PREVIEW_ERROR ? (
              <div className="doc-preview-error">
                <span className="doc-preview-error-label">Podgląd niedostępny</span>
                {errors[f.id] && (
                  <code className="doc-preview-error-msg">{errors[f.id]}</code>
                )}
                <span className="doc-preview-error-hint">Otwórz konsolę (F12) po więcej szczegółów.</span>
              </div>
            ) : previews[f.id] ? (
              <img
                src={previews[f.id] as string}
                alt={`Podgląd ${f.file.name}`}
                className="doc-preview-image"
              />
            ) : (
              <div className="doc-preview-skeleton">
                <span className="doc-preview-skeleton-label">Ładowanie podglądu...</span>
                <div className="doc-preview-skeleton-bar">
                  <div className="doc-preview-skeleton-bar-fill" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

