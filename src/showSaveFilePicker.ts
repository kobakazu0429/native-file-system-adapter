import { FileSystemFileHandle as MyFileSystemFileHandle } from "./FileSystemFileHandle";
import type { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import { FileHandle } from "./adapters/downloader";

/**
 * @param {Object} [options]
 * @param {boolean} [options.excludeAcceptAllOption=false] Prevent user for selecting any
 * @param {Object[]} [options.accepts] Files you want to accept
 * @param {string} [options.suggestedName] the name to fall back to when using polyfill
 * @param {string} [options._name] the name to fall back to when using polyfill
 * @param {boolean} [options._preferPolyfill] If you rather want to use the polyfill instead of the native
 * @returns
 */

interface Options {
  excludeAcceptAllOption: boolean;
  accepts: any;
  suggestedName: string;
  _name: string;
  _preferPolyfill: boolean;
}

export async function showSaveFilePicker(
  options: Partial<Options> = { excludeAcceptAllOption: false }
): Promise<FileSystemDirectoryHandle | FileSystemFileHandle> {
  // @ts-ignore
  const native = globalThis.showSaveFilePicker;
  if (native && !options._preferPolyfill) {
    return native(options);
  }

  if (options._name) {
    console.warn("deprecated _name, spec now have `suggestedName`");
    options.suggestedName = options._name;
  }
  // @ts-expect-error
  return new MyFileSystemFileHandle(new FileHandle(options.suggestedName));
}
