import FileSystemHandle from "./FileSystemHandle.js";
import FileSystemFileHandle from "./FileSystemFileHandle.js";

const kAdapter = Symbol("adapter");

class FileSystemDirectoryHandle extends FileSystemHandle {
  constructor(adapter) {
    super(adapter);
    this[kAdapter] = adapter;
  }

  /** @type {FileSystemDirectoryHandle} */ [kAdapter];

  /**
   * @param {string} name Name of the directory
   * @param {object} [options]
   * @param {boolean} [options.create] create the directory if don't exist
   * @returns {Promise<FileSystemDirectoryHandle>}
   */
  async getDirectoryHandle(name, options = {}) {
    if (name === "") throw new TypeError(`Name can't be an empty string.`);
    if (name === "." || name === ".." || name.includes("/"))
      throw new TypeError(`Name contains invalid characters.`);
    return new FileSystemDirectoryHandle(
      await this[kAdapter].getDirectoryHandle(name, options)
    );
  }

  /** @returns {AsyncGenerator<[string, FileSystemHandle], void, unknown>} */
  async *entries() {
    for await (const [_, entry] of this[kAdapter].entries())
      yield [
        entry.name,
        entry.kind === "file"
          ? new FileSystemFileHandle(entry)
          : new FileSystemDirectoryHandle(entry),
      ];
  }

  /** @deprecated use .entries() instead */
  async *getEntries() {
    console.warn("deprecated, use .entries() instead");
    for await (let entry of this[kAdapter].entries())
      yield entry.kind === "file"
        ? new FileSystemFileHandle(entry)
        : new FileSystemDirectoryHandle(entry);
  }

  /**
   * @param {string} name Name of the file
   * @param {object} [options]
   * @param {boolean} [options.create] create the file if don't exist
   * @returns {Promise<FileSystemFileHandle>}
   */
  async getFileHandle(name, options = {}) {
    if (name === "") throw new TypeError(`Name can't be an empty string.`);
    if (name === "." || name === ".." || name.includes("/"))
      throw new TypeError(`Name contains invalid characters.`);
    options.create = !!options.create;
    return new FileSystemFileHandle(
      await this[kAdapter].getFileHandle(name, options)
    );
  }

  /**
   * @param {string} name
   * @param {object} [options]
   * @param {boolean} [options.recursive]
   */
  async removeEntry(name, options = {}) {
    if (name === "") throw new TypeError(`Name can't be an empty string.`);
    if (name === "." || name === ".." || name.includes("/"))
      throw new TypeError(`Name contains invalid characters.`);
    options.recursive = !!options.recursive; // cuz node's fs.rm require boolean
    return this[kAdapter].removeEntry(name, options);
  }

  [Symbol.asyncIterator]() {
    return this.entries();
  }
}

Object.defineProperty(FileSystemDirectoryHandle.prototype, Symbol.toStringTag, {
  value: "FileSystemDirectoryHandle",
  writable: false,
  enumerable: false,
  configurable: true,
});

Object.defineProperties(FileSystemDirectoryHandle.prototype, {
  getDirectoryHandle: { enumerable: true },
  entries: { enumerable: true },
  getFileHandle: { enumerable: true },
  removeEntry: { enumerable: true },
});

export default FileSystemDirectoryHandle;
export { FileSystemDirectoryHandle };
