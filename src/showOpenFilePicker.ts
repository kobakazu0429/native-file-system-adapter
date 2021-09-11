import { fromInput } from "./util";
import type { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import type { FileSystemFileHandle } from "./FileSystemFileHandle";

const def = {
  accepts: [],
};

const native = globalThis.showOpenFilePicker;

interface Options {
  multiple: boolean;
  excludeAcceptAllOption: boolean;
  accepts: any[];
  _preferPolyfill: boolean;
}

export async function showOpenFilePicker(
  options: Options = {} as Options
): Promise<
  FileSystemDirectoryHandle | FileSystemFileHandle | FileSystemFileHandle[]
> {
  const opts = { ...def, ...options };

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
