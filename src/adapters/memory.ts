import { errors } from "../util";

export class Sink {
  constructor(fileHandle: FileHandle) {
    this.fileHandle = fileHandle;
    this.file = fileHandle.file;
    this.size = fileHandle.file.size;
    this.position = 0;
  }

  fileHandle: FileHandle;
  file: FileHandle["file"];
  size: FileHandle["file"]["size"];
  position: number;

  write(chunk: any) {
    let file = this.file;

    if (typeof chunk === "object") {
      if (chunk.type === "write") {
        if (Number.isInteger(chunk.position) && chunk.position >= 0) {
          this.position = chunk.position;
          if (this.size < chunk.position) {
            this.file = new File(
              [this.file, new ArrayBuffer(chunk.position - this.size)],
              this.file.name,
              this.file
            );
          }
        }
        if (!("data" in chunk)) {
          throw new Error(errors.SYNTAX("write requires a data argument"));
        }
        chunk = chunk.data;
      } else if (chunk.type === "seek") {
        if (Number.isInteger(chunk.position) && chunk.position >= 0) {
          if (this.size < chunk.position) {
            throw new Error(errors.INVALID);
          }
          this.position = chunk.position;
          return;
        } else {
          throw new Error(errors.SYNTAX("seek requires a position argument"));
        }
      } else if (chunk.type === "truncate") {
        if (Number.isInteger(chunk.size) && chunk.size >= 0) {
          file =
            chunk.size < this.size
              ? new File([file.slice(0, chunk.size)], file.name, file)
              : new File(
                  [file, new Uint8Array(chunk.size - this.size)],
                  file.name
                );

          this.size = file.size;
          if (this.position > file.size) {
            this.position = file.size;
          }
          this.file = file;
          return;
        } else {
          throw new Error(errors.SYNTAX("truncate requires a size argument"));
        }
      }
    }

    chunk = new Blob([chunk]);

    let blob = this.file;
    // Calc the head and tail fragments
    const head = blob.slice(0, this.position);
    const tail = blob.slice(this.position + chunk.size);

    // Calc the padding
    let padding = this.position - head.size;
    if (padding < 0) {
      padding = 0;
    }
    blob = new File([head, new Uint8Array(padding), chunk, tail], blob.name);

    this.size = blob.size;
    this.position += chunk.size;

    this.file = blob;
  }
  close() {
    if (this.fileHandle.deleted) throw new Error(errors.GONE);
    this.fileHandle.file = this.file;
    // @ts-ignore
    this.file = this.position = this.size = null;
    if ((this.fileHandle as any).onclose) {
      (this.fileHandle as any).onclose(this.fileHandle);
    }
  }
}

export class FileHandle {
  constructor(name = "", file = new File([], name), writable = true) {
    this.file = file;
    this.name = name;
    this.kind = "file";
    this.deleted = false;
    this.writable = writable;
    this.readable = true;
  }

  deleted: boolean;
  file: File;
  kind: string;
  name: string;
  readable: boolean;
  writable: boolean;

  getFile() {
    if (this.deleted) throw new Error(errors.GONE);
    return this.file;
  }

  createWritable(_opts: any) {
    if (!this.writable) throw new Error(errors.DISALLOWED);
    if (this.deleted) throw new Error(errors.GONE);
    return new Sink(this);
  }

  isSameEntry(other: any) {
    return this === other;
  }

  destroy() {
    this.deleted = true;
    // @ts-ignore
    this.file = null;
  }
}

export class FolderHandle {
  constructor(name: string, writable = true) {
    this.name = name;
    this.kind = "directory";
    this.deleted = false;
    this._entries = {};
    this.writable = writable;
    this.readable = true;
  }

  _entries: Record<string, FolderHandle | FileHandle>;
  kind: string;
  name: string;
  deleted: boolean;
  readable: boolean;
  writable: boolean;

  async *entries() {
    if (this.deleted) throw new Error(errors.GONE);
    yield* Object.entries(this._entries);
  }

  isSameEntry(other: any) {
    return this === other;
  }

  getDirectoryHandle(name: string, opts = {}) {
    if (this.deleted) throw new Error(errors.GONE);
    const entry = this._entries[name];
    if (entry) {
      // entry exist
      if (entry instanceof FileHandle) {
        throw new Error(errors.MISMATCH);
      } else {
        return entry;
      }
    } else {
      if ((opts as any).create) {
        return (this._entries[name] = new FolderHandle(name));
      } else {
        throw new Error(errors.GONE);
      }
    }
  }

  getFileHandle(name: string, opts = {}) {
    const entry = this._entries[name];
    const isFile = entry instanceof FileHandle;
    if (entry && isFile) return entry;
    if (entry && !isFile) throw new Error(errors.MISMATCH);
    if (!entry && !(opts as any).create) throw new Error(errors.GONE);
    if (!entry && (opts as any).create) {
      return (this._entries[name] = new FileHandle(name));
    }
  }

  removeEntry(name: string, opts: any) {
    const entry = this._entries[name];
    if (!entry) throw new Error(errors.GONE);
    entry.destroy(opts.recursive);
    delete this._entries[name];
  }

  destroy(recursive: boolean) {
    for (const x of Object.values(this._entries)) {
      if (!recursive) throw new Error(errors.MOD_ERR);
      (x as any).destroy(recursive);
    }
    this._entries = {};
    this.deleted = true;
  }
}

export default (_opts: any) => new FolderHandle("");
