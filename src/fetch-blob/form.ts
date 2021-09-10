import { createReadStream } from "fs";
import { stat } from "fs/promises";
import type { Stats } from "fs";
import { basename } from "path";

import Blob from "./index";
import { File } from "./file";

export const blobFrom = async (path: string, type: string) => {
  const s = await stat(path);
  return fromBlob(s, path, type);
};

export const fileFrom = async (path: string, type?: string) => {
  const s = await stat(path);
  return fromFile(s, path, type);
};

const fromBlob = (stat: Stats, path: string, type = "") => {
  return new Blob([new BlobDataItem(path, 0, stat.size, stat.mtimeMs)], {
    type,
  });
};

const fromFile = (stat: Stats, path: string, type = "") => {
  return new File(
    [new BlobDataItem(path, 0, stat.size, stat.mtimeMs)],
    basename(path),
    { type, lastModified: stat.mtimeMs }
  );
};

/**
 * This is a blob backed up by a file on the disk
 * with minium requirement. Its wrapped around a Blob as a blobPart
 * so you have no direct access to this.
 */

class BlobDataItem {
  constructor(
    private path: string,
    private start: number,
    public size: number,
    public lastModified: number
  ) {}

  /**
   * Slicing arguments is first validated and formatted
   * to not be out of range by Blob.prototype.slice
   */
  slice(start: number, end: number) {
    return new BlobDataItem(this.path, start, end - start, this.lastModified);
  }

  async *stream() {
    const { mtimeMs } = await stat(this.path);
    if (mtimeMs > this.lastModified) {
      throw new Error(
        "[NotReadableError] The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired."
      );
    }

    yield* createReadStream(this.path, {
      start: this.start,
      end: Math.max(this.start + this.size - 1, 0),
    });
  }

  get [Symbol.toStringTag]() {
    return "Blob";
  }
}
