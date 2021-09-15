import { fromInput } from "./util";
import type { FileSystemDirectoryHandle as MyFileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import type { FileSystemFileHandle as MyFileSystemFileHandle } from "./FileSystemFileHandle";

const def = {
  accepts: [],
};

interface Options {
  multiple: boolean;
  excludeAcceptAllOption: boolean;
  accepts: any[];
  _preferPolyfill: boolean;
}

export async function showOpenFilePicker(
  options: Options = {} as Options
): Promise<
  | FileSystemDirectoryHandle
  | FileSystemFileHandle
  | FileSystemFileHandle[]
  | MyFileSystemDirectoryHandle
  | MyFileSystemFileHandle
  | MyFileSystemFileHandle[]
> {
  const opts = { ...def, ...options };
  // @ts-ignore
  const native = globalThis.showOpenFilePicker;
  if (native && !options._preferPolyfill) {
    return native(opts);
  }

  const input = document.createElement("input");
  input.type = "file";
  input.multiple = (opts as any).multiple;
  input.accept = opts.accepts
    .map((e) => [
      ...((e as any).extensions || []).map((e: any) => "." + e),
      ...((e as any).mimeTypes || []),
    ])
    .flat()
    .join(",");

  return new Promise((resolve) => {
    input.onchange = () => resolve(fromInput(input));
    input.click();
  });
}
