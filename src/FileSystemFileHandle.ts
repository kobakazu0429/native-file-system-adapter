import FileSystemHandle from "./FileSystemHandle.js";
import FileSystemWritableFileStream from "./FileSystemWritableFileStream.js";

const kAdapter = Symbol("adapter");

class FileSystemFileHandle extends FileSystemHandle {
  constructor(adapter: any) {
    super(adapter);
    this[kAdapter] = adapter;
  }

  /** @type {FileSystemFileHandle} */
  // @ts-expect-error ts-migrate(7008) FIXME: Member '[kAdapter]' implicitly has an 'any' type.
  [kAdapter];

  /**
   * @param  {Object} [options={}]
   * @param  {boolean} [options.keepExistingData]
   * @returns {Promise<FileSystemWritableFileStream>}
   */
  async createWritable(options = {}) {
    return new FileSystemWritableFileStream(
      await this[kAdapter].createWritable(options)
    );
  }

  /**
   * @returns {Promise<File>}
   */
  getFile() {
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
