export type OutputFormat = "jpg" | "png" | "webp";

export const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

const JPEG_QUALITY = 0.92;

export function formatSpec(format: OutputFormat): {
  mime: string;
  quality?: number;
  ext: string;
} {
  if (format === "jpg") {
    return { mime: "image/jpeg", quality: JPEG_QUALITY, ext: "jpg" };
  }
  if (format === "webp") {
    return { mime: "image/webp", quality: JPEG_QUALITY, ext: "webp" };
  }
  return { mime: "image/png", ext: "png" };
}

export function detectFormat(file: File): OutputFormat {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "jpg";
  }
  if (type === "image/webp" || name.endsWith(".webp")) {
    return "webp";
  }
  return "png";
}
