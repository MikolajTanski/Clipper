import React, { DragEvent, useState } from "react";

type SpinaczFile = {
  id: string;
  file: File;
};

type Props = {
  files: SpinaczFile[];
  onRemove: (id: string) => void;
  onReorder: (sourceIndex: number, targetIndex: number) => void;
};

export const FileList: React.FC<Props> = ({ files, onRemove, onReorder }) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    onReorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  if (!files.length) {
    return (
      <div className="file-list-empty">
        <p className="file-list-empty-title">Lista czeka na pliki</p>
        <p>Po dodaniu PDF-ów ułóż je tu w kolejności zszycia.</p>
      </div>
    );
  }

  return (
    <div className="file-list">
      {files.map((item, index) => (
        <div
          key={item.id}
          className={[
            "file-item",
            dragIndex === index ? "file-item--dragging" : "",
            overIndex === index && dragIndex !== index ? "file-item--over" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <span className="file-item-index" aria-hidden="true">
            {index + 1}
          </span>
          <div className="file-item-handle" title="Przeciągnij" aria-hidden="true">
            ⋮⋮
          </div>
          <div className="file-item-main">
            <div className="file-item-name">{item.file.name}</div>
            <div className="file-item-meta">
              {(item.file.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <button
            type="button"
            className="file-item-remove"
            onClick={() => onRemove(item.id)}
            aria-label={`Usuń ${item.file.name}`}
          >
            Usuń
          </button>
        </div>
      ))}
    </div>
  );
};
