// @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
const native = globalThis.showDirectoryPicker;

/**
 * @param {Object} [options]
 * @param {boolean} [options._preferPolyfill] If you rather want to use the polyfill instead of the native
 * @returns Promise<FileSystemDirectoryHandle>
 */
async function showDirectoryPicker(options = {}) {
  if (native && !(options as any)._preferPolyfill) {
    return native(options);
  }

  const input = document.createElement("input");
  input.type = "file";
  (input as any).webkitdirectory = true;

  return new Promise((resolve) => {
    const p = import("./util.js").then((m) => m.fromInput);
    input.onchange = () => resolve(p.then((fn) => fn(input)));
    input.click();
  });
}

export default showDirectoryPicker;
export { showDirectoryPicker };
