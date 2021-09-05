const kAdapter = Symbol("adapter");

class FileSystemHandle {
  /** @param {FileSystemHandle & {writable}} adapter */
  constructor(adapter) {
    this.kind = adapter.kind;
    this.name = adapter.name;
    this[kAdapter] = adapter;
  }

  /** @type {FileSystemHandle} */
  [kAdapter];

  /** @type {string} */
  name;
  /** @type {('file'|'directory')} */
  kind;

  async queryPermission(options = {}) {
    if (options.readable) return "granted";
    const handle = this[kAdapter];
    return handle.queryPermission
      ? await handle.queryPermission(options)
      : handle.writable
      ? "granted"
      : "denied";
  }

  async requestPermission(options = {}) {
    if (options.readable) return "granted";
    const handle = this[kAdapter];
    return handle.writable ? "granted" : "denied";
  }

  /**
   * Attempts to remove the entry represented by handle from the underlying file system.
   *
   * @param {object} options
   * @param {boolean} [options.recursive=false]
   */
  async remove(options = {}) {
    await this[kAdapter].remove(options);
  }

  /**
   * @param {FileSystemHandle} other
   */
  async isSameEntry(other) {
    if (this === other) return true;
    if (
      !other ||
      typeof other !== "object" ||
      this.kind !== other.kind ||
      !other[kAdapter]
    )
      return false;
    return this[kAdapter].isSameEntry(other[kAdapter]);
  }
}

Object.defineProperty(FileSystemHandle.prototype, Symbol.toStringTag, {
  value: "FileSystemHandle",
  writable: false,
  enumerable: false,
  configurable: true,
});

export default FileSystemHandle;
export { FileSystemHandle };
