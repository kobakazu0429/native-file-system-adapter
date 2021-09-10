const kAdapter = Symbol("adapter");

class FileSystemHandle {
  constructor(adapter: FileSystemHandle & { writable: boolean }) {
    this.kind = adapter.kind;
    this.name = adapter.name;
    this[kAdapter] = adapter;
  }

  [kAdapter]: FileSystemHandle & { writable: boolean };

  name: string;
  kind: "file" | "directory";

  async queryPermission(
    options: { readable?: boolean; writable?: boolean } = {}
  ) {
    if (options.readable) return "granted";
    return this[kAdapter].queryPermission
      ? await this[kAdapter].queryPermission(options)
      : this[kAdapter].writable
      ? "granted"
      : "denied";
  }

  async requestPermission(options: { readable?: boolean } = {}) {
    if (options.readable) return "granted";
    const handle = this[kAdapter];
    return handle.writable ? "granted" : "denied";
  }

  /**
   * Attempts to remove the entry represented by handle from the underlying file system.
   */
  async remove(options: { recursive: boolean } = { recursive: false }) {
    await this[kAdapter].remove(options);
  }

  async isSameEntry(other: FileSystemHandle): Promise<boolean> {
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
