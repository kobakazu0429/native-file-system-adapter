import fs from "node:fs/promises";
import { join } from "path";
import { errors } from "../util";
import { fileFrom } from "../fetch-blob/form";

export class Sink {
  constructor(public fileHandle: any, public size: number) {}
  public position = 0;

  async abort() {
    await this.fileHandle.close();
  }

  async write(chunk: any) {
    if (typeof chunk === "object") {
      if (chunk.type === "write") {
        if (Number.isInteger(chunk.position) && chunk.position >= 0) {
          this.position = chunk.position;
        }
        if (!("data" in chunk)) {
          await this.fileHandle.close();
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
          await this.fileHandle.close();
          throw new Error(errors.SYNTAX("seek requires a position argument"));
        }
      } else if (chunk.type === "truncate") {
        if (Number.isInteger(chunk.size) && chunk.size >= 0) {
          await this.fileHandle.truncate(chunk.size);
          this.size = chunk.size;
          if (this.position > this.size) {
            this.position = this.size;
          }
          return;
        } else {
          await this.fileHandle.close();
          throw new Error(errors.SYNTAX("truncate requires a size argument"));
        }
      }
    }

    if (chunk instanceof ArrayBuffer) {
      chunk = new Uint8Array(chunk);
    } else if (typeof chunk === "string") {
      chunk = Buffer.from(chunk);
    } else if (chunk instanceof Blob) {
      // @ts-ignore
      for await (const data of chunk.stream()) {
        const res = await this.fileHandle.writev([data], this.position);
        this.position += res.bytesWritten;
        this.size += res.bytesWritten;
      }
      return;
    }

    const res = await this.fileHandle.writev([chunk], this.position);
    this.position += res.bytesWritten;
    this.size += res.bytesWritten;
  }

  async close() {
    await this.fileHandle.close();
  }
}

export class FileHandle {
  constructor(public path: string, public name: string) {}

  public kind = "file";

  async getFile() {
    await fs.stat(this.path).catch((err) => {
      if (err.code === "ENOENT") throw new Error(errors.GONE);
      throw err;
    });
    return await fileFrom(this.path);
  }

  isSameEntry(other: any) {
    return this.path === this.getPath.apply(other);
  }

  async createWritable() {
    const fileHandle = await fs.open(this.path, "r+").catch((err) => {
      if (err.code === "ENOENT") throw new Error(errors.GONE);
      throw err;
    });
    const { size } = await fileHandle.stat();
    return new Sink(fileHandle, size);
  }

  private getPath() {
    return this.path;
  }
}

export class FolderHandle {
  constructor(public path: string, public name = "") {}

  public kind = "directory";

  isSameEntry(other: any) {
    return this.path === other.path;
  }

  async *entries(): AsyncGenerator<
    readonly [string, FileHandle | FolderHandle],
    void,
    unknown
  > {
    const dir = this.path;
    const items = await fs.readdir(dir).catch((err) => {
      if (err.code === "ENOENT") throw new Error(errors.GONE);
      throw err;
    });
    for (const name of items) {
      const path = join(dir, name);
      const stat = await fs.lstat(path);
      if (stat.isFile()) {
        yield [name, new FileHandle(path, name)] as const;
      } else if (stat.isDirectory()) {
        yield [name, new FolderHandle(path, name)] as const;
      }
    }
  }

  async getDirectoryHandle(name: string, opts = {}) {
    const path = join(this.path, name);
    const stat = await fs.lstat(path).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
    const isDirectory = (stat as any)?.isDirectory();
    if (stat && isDirectory) return new FolderHandle(path, name);
    if (stat && !isDirectory) throw new Error(errors.MISMATCH);
    if (!(opts as any).create) throw new Error(errors.GONE);
    await fs.mkdir(path);
    return new FolderHandle(path, name);
  }

  async getFileHandle(name: string, opts: { create?: boolean } = {}) {
    const path = join(this.path, name);
    const stat = await fs.lstat(path).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
    if (stat) {
      if (stat.isFile()) return new FileHandle(path, name);
      else throw new Error(errors.MISMATCH);
    }
    if (!opts.create) throw new Error(errors.GONE);
    await (await fs.open(path, "w")).close();
    return new FileHandle(path, name);
  }

  async queryPermission() {
    return "granted";
  }

  async removeEntry(name: string, opts: { recursive?: boolean }) {
    const path = join(this.path, name);
    const stat = await fs.lstat(path).catch((err) => {
      if (err.code === "ENOENT") throw new Error(errors.GONE);
      throw err;
    });
    if (stat.isDirectory()) {
      if (opts.recursive) {
        await fs.rm(path, { recursive: true }).catch((err) => {
          if (err.code === "ENOTEMPTY") throw new Error(errors.MOD_ERR);
          throw err;
        });
      } else {
        await fs.rmdir(path).catch((err) => {
          if (err.code === "ENOTEMPTY") throw new Error(errors.MOD_ERR);
          throw err;
        });
      }
    } else {
      await fs.unlink(path);
    }
  }
}

export default (path: any) => new FolderHandle(path);
