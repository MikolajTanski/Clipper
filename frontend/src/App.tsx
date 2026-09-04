import React, { useCallback, useState } from "react";
import { FileDropzone } from "./components/FileDropzone";
import { FileList } from "./components/FileList";
import { DocumentPreview } from "./components/DocumentPreview";
import { ImageResize } from "./components/ImageResize";
import { PaperclipIcon } from "./components/PaperclipIcon";
import { mergePdfs } from "./mergePdfs";

type AppTab = "pdf" | "resize" | "about";

type SpinaczFile = {
  id: string;
  file: File;
};

const REPO_URL = "https://github.com/MikolajTanski/Clipper";
const LIVE_URL = "https://clipper.vercel.app";

const App: React.FC = () => {
  const [tab, setTab] = useState<AppTab>("pdf");
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

  const handleMerge = async () => {
    if (!files.length || isMerging) return;
    setIsMerging(true);
    setMergeProgress(0);
    setError(null);

    try {
      const bytes = await mergePdfs(
        files.map((f) => f.file),
        blankBetween,
        (done, total) => {
          setMergeProgress(Math.round((done / total) * 100));
        }
      );
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "spinacz.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nie udało się scalić plików.";
      setError(msg);
    } finally {
      setIsMerging(false);
      setMergeProgress(null);
    }
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

  const pdfStep = files.length === 0 ? 1 : files.length === 1 ? 2 : 3;
  const totalKb = files.reduce((sum, f) => sum + f.file.size, 0) / 1024;

  return (
    <div className="app-wrap">
      <div className="app-bg" aria-hidden="true">
        <div className="app-bg-desk" />
        <div className="app-bg-lamp" />
        <div className="app-bg-noise" />
      </div>
      <div className={`app${files.length && tab === "pdf" ? " app--has-dock" : ""}`}>
      {(isMerging || previewProgress !== null) && (
        <div className="top-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
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
        <div className="brand-block">
          <div className="logo" aria-label="Spinacz">
            <span className="logo-mark" aria-hidden="true">
              <PaperclipIcon className="logo-clip" />
            </span>
            <div className="logo-copy">
              <span className="logo-text">Spinacz</span>
              <span className="logo-tag">PDF i zdjęcia w przeglądarce</span>
            </div>
          </div>
          <p className="subtitle">
            {tab === "pdf"
              ? "Zszywaj PDF-y w kolejności, jaką ustawisz. Przetwarzanie w przeglądarce — bez zapisu na serwerze."
              : tab === "resize"
                ? "Zmień szerokość i wysokość zdjęcia. Wynik pobierasz od razu — nic nie zapisujemy u nas."
                : "Jak działa Spinacz, prywatność i skąd wziąć kod."}
          </p>
        </div>
        <div className="header-aside">
          <div className="app-tabs" role="tablist" aria-label="Tryb Spinacza">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "pdf"}
              className={`app-tab${tab === "pdf" ? " app-tab--active" : ""}`}
              onClick={() => setTab("pdf")}
            >
              Scal PDF
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "resize"}
              className={`app-tab${tab === "resize" ? " app-tab--active" : ""}`}
              onClick={() => setTab("resize")}
            >
              Rozmiar zdjęć
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "about"}
              className={`app-tab${tab === "about" ? " app-tab--active" : ""}`}
              onClick={() => setTab("about")}
            >
              O aplikacji
            </button>
          </div>
          <p className="privacy-chip" title="Hostowane na Vercel — serwujemy tylko statyczny frontend; plików nie zapisujemy">
            <span className="privacy-dot" aria-hidden="true" />
            Bez zapisu plików
          </p>
        </div>
      </header>

      <div className="tab-panel" hidden={tab !== "pdf"}>
        <ol className="flow-steps" aria-label="Jak scalić PDF">
          <li className={`flow-step${pdfStep >= 1 ? " flow-step--done" : ""}${pdfStep === 1 ? " flow-step--current" : ""}`}>
            <span className="flow-step-num">1</span>
            <span className="flow-step-label">Upuść pliki</span>
          </li>
          <li className={`flow-step${pdfStep >= 2 ? " flow-step--done" : ""}${pdfStep === 2 ? " flow-step--current" : ""}`}>
            <span className="flow-step-num">2</span>
            <span className="flow-step-label">Ułóż kolejność</span>
          </li>
          <li className={`flow-step${pdfStep >= 3 ? " flow-step--done" : ""}${pdfStep === 3 ? " flow-step--current" : ""}`}>
            <span className="flow-step-num">3</span>
            <span className="flow-step-label">Scal i pobierz</span>
          </li>
        </ol>

      <main className="layout layout--pdf">
        <section className="left-panel panel-sheet" aria-label="Podgląd dokumentu">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Stos kartek</h2>
              <p className="panel-subtitle">
                {files.length
                  ? `${files.length} ${files.length === 1 ? "plik" : files.length < 5 ? "pliki" : "plików"} · podgląd pierwszej strony każdego`
                  : "Tu pojawi się układ zszytego dokumentu"}
              </p>
            </div>
            {files.length > 0 && (
              <div className="panel-stat" aria-hidden="true">
                <span className="panel-stat-value">{files.length}</span>
                <span className="panel-stat-unit">w stosie</span>
              </div>
            )}
          </div>
          <DocumentPreview
            files={files}
            onProgress={handlePreviewProgress}
          />
        </section>

        <section className="right-panel panel-tools" aria-label="Narzędzia">
          <FileDropzone
            onFiles={handleAddFiles}
            title="Upuść PDF-y tutaj"
            subtitle="możesz dodać kilka naraz · albo kliknij"
            icon=""
          />

          <div className="tools-body">
            <div className="options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={blankBetween}
                  onChange={(e) => setBlankBetween(e.target.checked)}
                />
                <span>Pusta strona między plikami</span>
              </label>
            </div>

            {isMerging && mergeProgress !== null && (
              <p className="merge-progress-label">Scalanie: {mergeProgress}%</p>
            )}
            {!isMerging && previewProgress !== null && (
              <p className="merge-progress-label">
                Podglądy: {previewProgress.loaded}/{previewProgress.total} (
                {Math.round(
                  ((previewProgress.loaded + (previewProgress.currentFilePercent ?? 0) / 100) /
                    previewProgress.total) *
                    100
                )}
                %)
              </p>
            )}
            {error && (
              <div className="error-banner" role="alert">
                <strong>Scalanie nie wyszło.</strong> {error}
              </div>
            )}

            <div className="panel-list">
              <div className="panel-list-head">
                <h3 className="panel-title-small">Kolejność w wyniku</h3>
                {files.length > 1 && (
                  <span className="panel-hint">przeciągnij, by zmienić</span>
                )}
              </div>
              <FileList files={files} onRemove={handleRemoveFile} onReorder={handleReorder} />
            </div>
          </div>
        </section>
      </main>

      {files.length > 0 && (
        <div className="action-dock" role="region" aria-label="Scalanie">
          <div className="action-dock-meta">
            <PaperclipIcon className="action-dock-clip" />
            <div>
              <p className="action-dock-title">
                {files.length} {files.length === 1 ? "plik" : files.length < 5 ? "pliki" : "plików"} gotowe do zszycia
              </p>
              <p className="action-dock-sub">
                łącznie ~{totalKb >= 1024 ? `${(totalKb / 1024).toFixed(1)} MB` : `${totalKb.toFixed(0)} KB`}
                {blankBetween ? " · z pustymi stronami" : ""}
              </p>
            </div>
          </div>
          <button
            className="primary-button primary-button--dock"
            onClick={handleMerge}
            disabled={isMerging}
          >
            {isMerging
              ? `Scalanie${mergeProgress !== null ? ` ${mergeProgress}%` : "…"}`
              : "Scal PDF"}
          </button>
        </div>
      )}
      </div>

      <div className="tab-panel" hidden={tab !== "resize"}>
        <ImageResize />
      </div>

      <div className="tab-panel" hidden={tab !== "about"}>
        <article className="about-panel panel-sheet">
          <h2 className="panel-title">O aplikacji</h2>
          <p className="about-lead">
            Spinacz działa w przeglądarce i jest hostowany na <strong>Vercel</strong> jako
            czysty frontend — bez backendu, bez konta i bez bazy danych.
          </p>
          <ul className="about-list">
            <li>
              Scalanie PDF i zmiana rozmiaru zdjęć dzieją się <strong>w Twojej przeglądarce</strong>
              (JavaScript), nie na naszym serwerze.
            </li>
            <li>
              <strong>Nie wysyłamy i nie zapisujemy Twoich plików</strong> — Vercel serwuje tylko
              statyczny HTML, CSS i JS. To możesz sprawdzić w kodzie i w zakładce sieci przeglądarki.
            </li>
            <li>
              Kod jest otwarty: nie ma API do uploadu ani przechowywania dokumentów.
            </li>
          </ul>
          <div className="about-links">
            <a className="about-link about-link--primary" href={REPO_URL} target="_blank" rel="noreferrer">
              Repozytorium na GitHubie
            </a>
            <a className="about-link" href={LIVE_URL} target="_blank" rel="noreferrer">
              Wersja na Vercel
            </a>
          </div>
        </article>
      </div>
      </div>
    </div>
  );
};

export default App;
