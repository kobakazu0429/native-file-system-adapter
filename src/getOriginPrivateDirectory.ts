import FileSystemDirectoryHandle from "./FileSystemDirectoryHandle.js";

if (
  globalThis.DataTransferItem &&
  !(DataTransferItem.prototype as any).getAsFileSystemHandle
) {
  (DataTransferItem.prototype as any).getAsFileSystemHandle =
    async function () {
      const entry = this.webkitGetAsEntry();
      const [
        { FileHandle, FolderHandle },
        { FileSystemDirectoryHandle },
        { FileSystemFileHandle },
      ] = await Promise.all([
        // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module './adapters/sandbox.js' or its ... Remove this comment to see the full error message
        import("./adapters/sandbox.js"),
        import("./FileSystemDirectoryHandle.js"),
        import("./FileSystemFileHandle.js"),
      ]);
      return entry.isFile
        ? new FileSystemFileHandle(new FileHandle(entry, false))
        : new FileSystemDirectoryHandle(new FolderHandle(entry, false));
    };
}

/**
 * @param {object=} driver
 * @return {Promise<FileSystemDirectoryHandle>}
 */
async function getOriginPrivateDirectory(driver: any, options = {}) {
  if (typeof DataTransfer === "function" && driver instanceof DataTransfer) {
    console.warn(
      'deprecated getOriginPrivateDirectory(dataTransfer). Use "dt.items.getAsFileSystemHandle()"'
    );
    const entries = Array.from(driver.items).map((item) =>
      item.webkitGetAsEntry()
    );
    return import("./util.js").then((m) => m.fromDataTransfer(entries));
  }
  if (!driver) {
    return (
      (globalThis.navigator?.storage as any)?.getDirectory() ||
      // @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
      globalThis.getOriginPrivateDirectory()
    );
  }
  const module = await driver;
  const sandbox = module.default
    ? await module.default(options)
    : module(options);
  return new FileSystemDirectoryHandle(sandbox);
}

export default getOriginPrivateDirectory;
