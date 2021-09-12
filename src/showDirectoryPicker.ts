import type { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import { fromInput } from "./util";

export async function showDirectoryPicker(
  options: { _preferPolyfill?: boolean } = {}
): Promise<FileSystemDirectoryHandle> {
  // @ts-ignore
  const native = globalThis.showDirectoryPicker as any;
  if (native && !options._preferPolyfill) {
    return native(options);
  }

  const input = document.createElement("input");
  input.type = "file";
  (input as any).webkitdirectory = true;

  return new Promise((resolve) => {
    input.onchange = () => resolve(fromInput(input) as any);
    input.click();
  });
}
