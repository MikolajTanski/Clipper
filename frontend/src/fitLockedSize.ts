export type SizeChange = "width" | "height";

export function fitLockedSize(opts: {
  origWidth: number;
  origHeight: number;
  width: number;
  height: number;
  changed: SizeChange;
  locked: boolean;
}): { width: number; height: number } {
  const width = Math.max(1, Math.round(opts.width) || 1);
  const height = Math.max(1, Math.round(opts.height) || 1);
  if (!opts.locked || opts.origWidth < 1 || opts.origHeight < 1) {
    return { width, height };
  }
  if (opts.changed === "width") {
    return {
      width,
      height: Math.max(1, Math.round((width * opts.origHeight) / opts.origWidth)),
    };
  }
  return {
    width: Math.max(1, Math.round((height * opts.origWidth) / opts.origHeight)),
    height,
  };
}
