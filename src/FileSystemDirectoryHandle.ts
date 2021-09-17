import { FileSystemHandle } from "./FileSystemHandle";
import { FileSystemFileHandle } from "./FileSystemFileHandle";

const kAdapter = Symbol("adapter");

export class FileSystemDirectoryHandle extends FileSystemHandle {
  constructor(adapter: any) {
    super(adapter);
    this[kAdapter] = adapter;
  }

  public kind = "directory" as const;

  [kAdapter]: FileSystemDirectoryHandle;

  async getDirectoryHandle(
    name: string,
    options: { create?: boolean; capture?: boolean } = {}
  ): Promise<FileSystemDirectoryHandle> {
    if (name === "") throw new TypeError(`Name can't be an empty string.`);
    if (name === "." || name === ".." || name.includes("/"))
      throw new TypeError(`Name contains invalid characters.`);

    return new FileSystemDirectoryHandle(
      await this[kAdapter].getDirectoryHandle(name, options)
    );
  }

  async *entries(): AsyncGenerator<[string, FileSystemHandle], void, unknown> {
    for await (const [, entry] of this[kAdapter].entries())
      yield [
        entry.name,
        entry.kind === "file"
          ? new FileSystemFileHandle(entry)
          : new FileSystemDirectoryHandle(entry),
      ];
  }

  async *values(): AsyncGenerator<FileSystemHandle> {
    for await (const entry of this[kAdapter].values())
      yield entry.kind === "file"
        ? new FileSystemFileHandle(entry)
        : new FileSystemDirectoryHandle(entry);
  }

  async getFileHandle(
    name: string,
    options = { create: false }
  ): Promise<FileSystemFileHandle> {
    if (name === "") throw new TypeError(`Name can't be an empty string.`);
    if (name === "." || name === ".." || name.includes("/"))
      throw new TypeError(`Name contains invalid characters.`);
    return new FileSystemFileHandle(
      await this[kAdapter].getFileHandle(name, options)
    );
  }

  async removeEntry(
    name: string,
    options = { recursive: false }
  ): Promise<void> {
    if (name === "") throw new TypeError(`Name can't be an empty string.`);
    if (name === "." || name === ".." || name.includes("/"))
      throw new TypeError(`Name contains invalid characters.`);
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
