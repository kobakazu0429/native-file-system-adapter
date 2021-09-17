const kAdapter = Symbol("adapter");

export class FileSystemHandle {
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
  ): Promise<"granted" | "denied"> {
    if (options.readable) return "granted";

    return this.adapter.queryPermission
      ? this.adapter.queryPermission(options)
      : this.adapter.writable
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
