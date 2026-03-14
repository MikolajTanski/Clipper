import React, { useCallback, useState } from "react";
import { FileDropzone } from "./components/FileDropzone";
import { FileList } from "./components/FileList";
import { DocumentPreview } from "./components/DocumentPreview";

type SpinaczFile = {
  id: string;
  file: File;
};

const API_URL = "/api/merge";

const App: React.FC = () => {
  const [files, setFiles] = useState<SpinaczFile[]>([]);
  const [blankBetween, setBlankBetween] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeProgress, setMergeProgress] = useState<number | null>(null);
  const [previewProgress, setPreviewProgress] = useState<{
    loaded: number;
    total: number;
    currentFilePercent?: number;
  } | null>(null);

  const handleAddFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles
        .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
        .map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file
        }))
    ]);
  }, []);

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleReorder = (sourceIndex: number, targetIndex: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  const handleMerge = () => {
    if (!files.length || isMerging) return;
    setIsMerging(true);
    setMergeProgress(0);
    setError(null);

    const formData = new FormData();
    files.forEach((f) => {
      formData.append("files", f.file, f.file.name);
    });
    formData.append("blank_between", String(blankBetween));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL);
    xhr.responseType = "blob";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setMergeProgress(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response;
        if (blob instanceof Blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "spinacz.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
        setError(null);
      } else {
        let msg = "Nie udało się scalić plików.";
        const blob = xhr.response;
        if (blob instanceof Blob) {
          try {
            const json = JSON.parse(await blob.text());
            if (typeof json?.error === "string") msg = json.error;
          } catch {
            /* zostaw domyślny msg */
          }
        }
        setError(msg);
      }
      setIsMerging(false);
      setMergeProgress(null);
    };

    xhr.onerror = () => {
      setError("Błąd połączenia podczas scalania plików.");
      setIsMerging(false);
      setMergeProgress(null);
    };

    xhr.send(formData);
  };

  const handlePreviewProgress = useCallback((
    loaded: number,
    total: number,
    currentFilePercent?: number
  ) => {
    if (total === 0) {
      setPreviewProgress(null);
      return;
    }
    setPreviewProgress({ loaded, total, currentFilePercent });
    if (loaded >= total && currentFilePercent === undefined) {
      window.setTimeout(() => setPreviewProgress(null), 400);
    }
  }, []);

  return (
    <div className="app-wrap">
      <div className="app-bg" aria-hidden="true">
        <div className="app-bg-stripes" />
        <div className="app-bg-gradient app-bg-gradient--1" />
        <div className="app-bg-gradient app-bg-gradient--2" />
        <div className="app-bg-gradient app-bg-gradient--3" />
        <div className="app-bg-noise" />
      </div>
      <div className="app">
      {(isMerging || previewProgress !== null) && (
        <div className="top-progress">
          <div
            className="top-progress-bar"
            style={
              isMerging && mergeProgress !== null
                ? { width: `${Math.max(5, mergeProgress)}%` }
                : previewProgress
                  ? {
                      width: `${Math.max(
                        5,
                        Math.round(
                          ((previewProgress.loaded + (previewProgress.currentFilePercent ?? 0) / 100) /
                            previewProgress.total) *
                            100
                        )
                      )}%`
                    }
                  : undefined
            }
          />
        </div>
      )}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">✂️</span>
          <span className="logo-text">Spinacz</span>
        </div>
        <p className="subtitle">
          Ciemny, czarno-zielony łącznik PDF-ów – lokalnie, bez chmury.
        </p>
      </header>

      <main className="layout">
        <section className="left-panel">
          <h2 className="panel-title">Podgląd zszytego dokumentu</h2>
          <p className="panel-subtitle">
            Każdy dodany plik to kolejny blok kartek. Kolejność poniżej = kolejność w wyniku.
          </p>
          <DocumentPreview
            files={files}
            onProgress={handlePreviewProgress}
          />
        </section>

        <section className="right-panel">
          <FileDropzone onFiles={handleAddFiles} />
          <div className="options">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={blankBetween}
                onChange={(e) => setBlankBetween(e.target.checked)}
              />
              <span>Dodaj pustą stronę między plikami</span>
            </label>
          </div>
          <button
            className="primary-button"
            onClick={handleMerge}
            disabled={!files.length || isMerging}
          >
            {isMerging
              ? `Scalanie...${mergeProgress !== null ? ` ${mergeProgress}%` : ""}`
              : "Scal PDF"}
          </button>
          {isMerging && mergeProgress !== null && (
            <p className="merge-progress-label">Wysyłanie i scalanie: {mergeProgress}%</p>
          )}
          {!isMerging && previewProgress !== null && (
            <p className="merge-progress-label">
              Ładowanie podglądów: {previewProgress.loaded} / {previewProgress.total} (
              {Math.round(
                ((previewProgress.loaded + (previewProgress.currentFilePercent ?? 0) / 100) /
                  previewProgress.total) *
                  100
              )}
              %)
            </p>
          )}
          {error && <div className="error-banner">{error}</div>}

          <div className="panel-list">
            <h3 className="panel-title-small">Kolejność plików</h3>
            <FileList files={files} onRemove={handleRemoveFile} onReorder={handleReorder} />
          </div>
        </section>
      </main>
      </div>
    </div>
  );
};

export default App;

