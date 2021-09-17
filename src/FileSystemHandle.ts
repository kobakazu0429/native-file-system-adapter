// import type { ImplFolderHandle } from "./adapters/implements";
// import type { ImpleFileHandle } from "./adapters/implements";

export class FileSystemHandle {
  constructor(public adapter: any) {
    this.kind = adapter.kind;
    this.name = adapter.name;
  }

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
    return this.adapter.writable ? "granted" : "denied";
  }

  async isSameEntry(other: FileSystemHandle): Promise<boolean> {
    if (this === other) return true;
    if (
      typeof other !== "object" ||
      this.kind !== other.kind ||
      !other.adapter
    ) {
      return false;
    }
    return this.adapter.isSameEntry(other.adapter);
  }

  get [Symbol.toStringTag]() {
    return "FileSystemHandle";
  }
}
