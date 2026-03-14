import React, { DragEvent, useRef, useState } from "react";

type Props = {
  onFiles: (files: File[]) => void;
};

export const FileDropzone: React.FC<Props> = ({ onFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files || []).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (files.length) {
      onFiles(files);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files || []).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (files.length) {
      onFiles(files);
    }
    // reset, żeby ponownie wybrać te same pliki
    event.target.value = "";
  };

  return (
    <div
      className={`dropzone ${isDragging ? "dropzone--active" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden-input"
        onChange={handleFileChange}
      />
      <div className="dropzone-inner">
        <div className="dropzone-icon">📎</div>
        <div className="dropzone-title">Przeciągnij i upuść PDFy tutaj</div>
        <div className="dropzone-subtitle">albo kliknij, aby wybrać pliki</div>
      </div>
    </div>
  );
};

