import { FileSystemHandle } from "./FileSystemHandle";
import { FileSystemWritableFileStream } from "./FileSystemWritableFileStream";

export class FileSystemFileHandle extends FileSystemHandle {
  constructor(adapter: any) {
    super(adapter);
  }

  public kind = "file" as const;

  async createWritable(
    options: { keepExistingData?: boolean } = {}
  ): Promise<FileSystemWritableFileStream> {
    return new FileSystemWritableFileStream(
      await this.adapter.createWritable(options)
    );
  }

  getFile(): Promise<File> {
    return Promise.resolve(this.adapter.getFile());
  }

  get [Symbol.toStringTag]() {
    return "FileSystemFileHandle";
  }
}
