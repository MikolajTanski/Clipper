import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileDropzone } from "./FileDropzone";
import { fitLockedSize } from "../fitLockedSize";
import { detectFormat, formatSpec, OUTPUT_FORMATS, type OutputFormat } from "../imageFormat";

const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
const MAX_SIDE = 8192;

const isImageFile = (file: File): boolean => {
  const type = file.type.toLowerCase();
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)) {
    return true;
  }
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
};

const downloadName = (file: File, width: number, height: number, ext: string): string => {
  const base = file.name.replace(/\.[^.]+$/, "") || "obraz";
  return `${base}-${width}x${height}.${ext}`;
};

const formatBytes = (n: number): string => {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
};

const rasterize = (
  img: HTMLImageElement,
  width: number,
  height: number,
  mime: string,
  quality?: number
): Promise<Blob | null> => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve) => {
    if (quality !== undefined) {
      canvas.toBlob((blob) => resolve(blob), mime, quality);
    } else {
      canvas.toBlob((blob) => resolve(blob), mime);
    }
  });
};

export const ImageResize: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [locked, setLocked] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const resultBlobRef = useRef<Blob | null>(null);
  const originalUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const revokeOriginal = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const revokeResult = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  originalUrlRef.current = originalUrl;
  resultUrlRef.current = resultUrl;

  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const handleRejected = () => {
    setError("Ten plik nie jest obrazem (JPG, PNG, WebP).");
  };

  const handleFiles = (files: File[]) => {
    const next = files.find(isImageFile);
    if (!next) {
      handleRejected();
      return;
    }

    const url = URL.createObjectURL(next);
    const img = new Image();
    img.onload = () => {
      if (Math.max(img.naturalWidth, img.naturalHeight) > MAX_SIDE) {
        URL.revokeObjectURL(url);
        setError("Obraz jest za duży (max 8192 px na bok).");
        return;
      }
      setOriginalUrl((prev) => {
        revokeOriginal(prev);
        return url;
      });
      setResultUrl((prev) => {
        revokeResult(prev);
        return null;
      });
      resultBlobRef.current = null;
      setResultSize(null);
      imageRef.current = img;
      setFile(next);
      setOutputFormat(detectFormat(next));
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setError(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Nie udało się wczytać obrazu.");
    };
    img.src = url;
  };

  const updateDim = (changed: "width" | "height", raw: string) => {
    // Allow empty while typing so the user can clear e.g. 2000 → type 800.
    if (raw.trim() === "") {
      if (changed === "width") setWidth(0);
      else setHeight(0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const nextWidth = changed === "width" ? parsed : width;
    const nextHeight = changed === "height" ? parsed : height;
    const fitted = fitLockedSize({
      origWidth,
      origHeight,
      width: nextWidth,
      height: nextHeight,
      changed,
      locked,
    });
    setWidth(fitted.width);
    setHeight(fitted.height);
  };

  const commitDim = (changed: "width" | "height") => {
    const current = changed === "width" ? width : height;
    if (current >= 1) return;
    const fallback = changed === "width" ? origWidth || 1 : origHeight || 1;
    updateDim(changed, String(fallback));
  };

  useEffect(() => {
    const img = imageRef.current;
    if (!img || !file || width < 1 || height < 1) return;

    setResultUrl((prev) => {
      revokeResult(prev);
      return null;
    });
    resultBlobRef.current = null;
    setResultSize(null);

    const { mime, quality } = formatSpec(outputFormat);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void rasterize(img, width, height, mime, quality).then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setError("Nie udało się wygenerować pliku.");
          return;
        }
        const url = URL.createObjectURL(blob);
        setResultUrl((prev) => {
          revokeResult(prev);
          return url;
        });
        resultBlobRef.current = blob;
        setResultSize(blob.size);
      });
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [file, width, height, outputFormat, revokeResult]);

  const clearImage = () => {
    revokeOriginal(originalUrl);
    revokeResult(resultUrl);
    imageRef.current = null;
    resultBlobRef.current = null;
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setResultSize(null);
    setOrigWidth(0);
    setOrigHeight(0);
    setWidth(0);
    setHeight(0);
    setError(null);
  };

  const handleDownload = () => {
    const blob = resultBlobRef.current;
    if (!file || !blob) return;
    const { ext } = formatSpec(outputFormat);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName(file, width, height, ext);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="layout layout--resize">
      <section className="left-panel panel-sheet" aria-label="Podgląd obrazu">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Porównanie</h2>
            <p className="panel-subtitle">
              {file
                ? `${origWidth}×${origHeight} → ${width}×${height} px`
                : "Oryginał i wynik obok siebie — zanim pobierzesz"}
            </p>
          </div>
        </div>
        {originalUrl ? (
          <div className="image-previews">
            <figure className="image-preview-pane">
              <figcaption>Oryginał</figcaption>
              <img src={originalUrl} alt="Oryginał" />
            </figure>
            <figure className="image-preview-pane">
              <figcaption>Po zmianie</figcaption>
              {resultUrl ? (
                <img src={resultUrl} alt="Po zmianie" />
              ) : (
                <div className="image-preview-empty">Przeliczanie…</div>
              )}
            </figure>
          </div>
        ) : (
          <div className="doc-preview-empty">
            <div className="empty-frame" aria-hidden="true">
              <span className="empty-frame-cross" />
            </div>
            <div className="doc-preview-placeholder">
              <p className="empty-lead">Brak obrazu</p>
              <p>Upuść zdjęcie po prawej — tu zobaczysz oryginał i wynik.</p>
            </div>
          </div>
        )}
      </section>

      <section className="right-panel panel-tools" aria-label="Ustawienia rozmiaru">
        {!file ? (
          <FileDropzone
            onFiles={handleFiles}
            onRejected={handleRejected}
            accept={IMAGE_ACCEPT}
            multiple={false}
            icon=""
            title="Upuść obraz tutaj"
            subtitle="JPG, PNG lub WebP — albo kliknij, żeby wybrać"
            filter={isImageFile}
          />
        ) : (
          <button type="button" className="remove-image" onClick={clearImage}>
            Usuń zdjęcie
          </button>
        )}

        <div className="dim-row">
          <label className="dim-field">
            <span>Szerokość</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={width || ""}
              disabled={!file}
              onChange={(e) => updateDim("width", e.target.value)}
              onBlur={() => commitDim("width")}
            />
          </label>
          <label className="dim-field">
            <span>Wysokość</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={height || ""}
              disabled={!file}
              onChange={(e) => updateDim("height", e.target.value)}
              onBlur={() => commitDim("height")}
            />
          </label>
          <label className="checkbox dim-lock">
            <input
              type="checkbox"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
              disabled={!file}
            />
            <span>Zachowaj proporcje</span>
          </label>
        </div>

        <label className="dim-field format-field">
          <span>Format zapisu</span>
          <select
            value={outputFormat}
            disabled={!file}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          >
            {OUTPUT_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="size-row">
          <div>
            <span className="size-label">Oryginał</span>
            <span className="size-value">{file ? formatBytes(file.size) : "—"}</span>
          </div>
          <div>
            <span className="size-label">Po zmianie</span>
            <span className="size-value">
              {resultSize !== null ? formatBytes(resultSize) : "—"}
            </span>
          </div>
        </div>

        <button className="primary-button" onClick={handleDownload} disabled={!resultUrl}>
          Pobierz
        </button>
        {error && <div className="error-banner">{error}</div>}
      </section>
    </main>
  );
};
