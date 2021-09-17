import { FileSystemFileHandle as MyFileSystemFileHandle } from "./FileSystemFileHandle";
import type { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import { FileHandle } from "./adapters/downloader";

/**
 * @param {Object} [options]
 * @param {boolean} [options.excludeAcceptAllOption=false] Prevent user for selecting any
 * @param {Object[]} [options.accepts] Files you want to accept
 * @param {string} [options.suggestedName] the name to fall back to when using polyfill
 * @returns
 */

interface Options {
  excludeAcceptAllOption: boolean;
  accepts: any;
  suggestedName: string;
}

export async function showSaveFilePicker(
  options: Partial<Options> = { excludeAcceptAllOption: false }
): Promise<FileSystemDirectoryHandle | MyFileSystemFileHandle> {
  return new MyFileSystemFileHandle(new FileHandle(options.suggestedName));
}
