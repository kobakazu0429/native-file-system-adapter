import FileSystemHandle from "./FileSystemHandle";
import FileSystemWritableFileStream from "./FileSystemWritableFileStream";

const kAdapter = Symbol("adapter");

class FileSystemFileHandle extends FileSystemHandle {
  constructor(adapter: any) {
    super(adapter);
    this[kAdapter] = adapter;
  }

  [kAdapter]: FileSystemFileHandle;

  async createWritable(
    options: { keepExistingData?: boolean } = {}
  ): Promise<FileSystemWritableFileStream> {
    return new FileSystemWritableFileStream(
      await this[kAdapter].createWritable(options)
    );
  }

  getFile(): Promise<File> {
    return Promise.resolve(this[kAdapter].getFile());
  }
}

Object.defineProperty(FileSystemFileHandle.prototype, Symbol.toStringTag, {
  value: "FileSystemFileHandle",
  writable: false,
  enumerable: false,
  configurable: true,
});

Object.defineProperties(FileSystemFileHandle.prototype, {
  createWritable: { enumerable: true },
  getFile: { enumerable: true },
});

export default FileSystemFileHandle;
export { FileSystemFileHandle };
