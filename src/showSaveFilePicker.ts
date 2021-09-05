// @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
const native = globalThis.showSaveFilePicker;

/**
 * @param {Object} [options]
 * @param {boolean} [options.excludeAcceptAllOption=false] Prevent user for selecting any
 * @param {Object[]} [options.accepts] Files you want to accept
 * @param {string} [options.suggestedName] the name to fall back to when using polyfill
 * @param {string} [options._name] the name to fall back to when using polyfill
 * @param {boolean} [options._preferPolyfill] If you rather want to use the polyfill instead of the native
 * @returns Promise<FileSystemDirectoryHandle>
 */
async function showSaveFilePicker(options = {}) {
  if (native && !(options as any)._preferPolyfill) {
    return native(options);
  }

  if ((options as any)._name) {
    console.warn("deprecated _name, spec now have `suggestedName`");
    (options as any).suggestedName = (options as any)._name;
  }

  const FileSystemFileHandle = await import("./FileSystemFileHandle.js").then(
    (d) => d.default
  );
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './adapters/downloader.js' or i... Remove this comment to see the full error message
  const { FileHandle } = await import("./adapters/downloader.js");
  return new FileSystemFileHandle(
    new FileHandle((options as any).suggestedName)
  );
}

export default showSaveFilePicker;
export { showSaveFilePicker };
