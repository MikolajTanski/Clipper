import React, { DragEvent, useRef, useState } from "react";
import { PaperclipIcon } from "./PaperclipIcon";

export type FileDropzoneProps = {
  onFiles: (files: File[]) => void;
  onRejected?: () => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  icon?: string;
  filter?: (file: File) => boolean;
};

const defaultFilter = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFiles,
  onRejected,
  accept = "application/pdf",
  multiple = true,
  title = "Upuść PDF-y tutaj",
  subtitle = "albo kliknij, żeby wybrać",
  icon,
  filter = defaultFilter,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const takeFiles = (list: File[]) => {
    const accepted = list.filter(filter);
    if (accepted.length) {
      onFiles(accepted);
      return;
    }
    if (list.length) {
      onRejected?.();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    takeFiles(Array.from(event.dataTransfer.files || []));
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
    takeFiles(Array.from(event.target.files || []));
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
        accept={accept}
        multiple={multiple}
        className="hidden-input"
        onChange={handleFileChange}
      />
      <div className="dropzone-inner">
        <div className="dropzone-icon" aria-hidden="true">
          {icon ? icon : <PaperclipIcon className="dropzone-clip" />}
        </div>
        <div className="dropzone-title">{title}</div>
        <div className="dropzone-subtitle">{subtitle}</div>
      </div>
    </div>
  );
};
