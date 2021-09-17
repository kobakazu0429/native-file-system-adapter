import { FileSystemHandle } from "./FileSystemHandle";
import { FileSystemWritableFileStream } from "./FileSystemWritableFileStream";

const kAdapter = Symbol("adapter");

export class FileSystemFileHandle extends FileSystemHandle {
  constructor(adapter: any) {
    super(adapter);
    this[kAdapter] = adapter;
  }

  public kind = "file" as const;

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

  get [Symbol.toStringTag]() {
    return "FileSystemFileHandle";
  }
}
