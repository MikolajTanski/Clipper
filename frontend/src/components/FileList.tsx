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

  const handleDragStart = (event: DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onReorder(dragIndex, index);
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  if (!files.length) {
    return <div className="file-list-empty">Brak plików – dodaj PDFy z lewej strony.</div>;
  }

  return (
    <div className="file-list">
      {files.map((item, index) => (
        <div
          key={item.id}
          className={`file-item ${dragIndex === index ? "file-item--dragging" : ""}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="file-item-handle">↕</div>
          <div className="file-item-main">
            <div className="file-item-name">{item.file.name}</div>
            <div className="file-item-meta">
              {(item.file.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <button className="file-item-remove" onClick={() => onRemove(item.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

