import { PDFDocument } from "pdf-lib";

export type MergeProgress = (done: number, total: number) => void;

/** Merge PDFs in the browser. Optional blank page between files. */
export async function mergePdfs(
  files: File[],
  blankBetween: boolean,
  onProgress?: MergeProgress
): Promise<Uint8Array> {
  if (!files.length) {
    throw new Error("Brak plików do scalenia.");
  }

  const out = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const bytes = await files[i].arrayBuffer();
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) {
      out.addPage(page);
    }

    if (blankBetween && i < files.length - 1 && out.getPageCount() > 0) {
      const last = out.getPage(out.getPageCount() - 1);
      const { width, height } = last.getSize();
      out.addPage([width, height]);
    }

    onProgress?.(i + 1, total);
  }

  return out.save();
}
