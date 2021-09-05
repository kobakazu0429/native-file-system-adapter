const def = {
  accepts: [],
};
// @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
const native = globalThis.showOpenFilePicker;

/**
 * @param {Object} [options]
 * @param {boolean} [options.multiple] If you want to allow more than one file
 * @param {boolean} [options.excludeAcceptAllOption=false] Prevent user for selecting any
 * @param {Object[]} [options.accepts] Files you want to accept
 * @param {boolean} [options._preferPolyfill] If you rather want to use the polyfill instead of the native
 * @returns Promise<FileSystemDirectoryHandle>
 */
async function showOpenFilePicker(options = {}) {
  const opts = { ...def, ...options };

  if (native && !(options as any)._preferPolyfill) {
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
    const p = import("./util.js").then((m) => m.fromInput);
    input.onchange = () => resolve(p.then((fn) => fn(input)));
    input.click();
  });
}

export default showOpenFilePicker;
export { showOpenFilePicker };
