import fs from "fs/promises";
import { errors } from "../util.js";
import { join } from "path";
import Blob from "fetch-blob";
import { fileFrom } from "fetch-blob/from.js";
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'node... Remove this comment to see the full error message
import DOMException from "node-domexception";

// import mime from 'mime-types'

const { INVALID, GONE, MISMATCH, MOD_ERR, SYNTAX } = errors;

export class Sink {
  fileHandle: any;
  position: any;
  size: any;
  constructor(fileHandle: any, size: any) {
    this.fileHandle = fileHandle;
    this.size = size;
    this.position = 0;
  }
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
          throw new DOMException(...SYNTAX("write requires a data argument"));
        }
        chunk = chunk.data;
      } else if (chunk.type === "seek") {
        if (Number.isInteger(chunk.position) && chunk.position >= 0) {
          if (this.size < chunk.position) {
            throw new DOMException(...INVALID);
          }
          this.position = chunk.position;
          return;
        } else {
          await this.fileHandle.close();
          throw new DOMException(
            ...SYNTAX("seek requires a position argument")
          );
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
          throw new DOMException(
            ...SYNTAX("truncate requires a size argument")
          );
        }
      }
    }

    if (chunk instanceof ArrayBuffer) {
      chunk = new Uint8Array(chunk);
    } else if (typeof chunk === "string") {
      chunk = Buffer.from(chunk);
    } else if (chunk instanceof Blob) {
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
  kind: any;
  name: any;
  /**
   * @param {string} path
   * @param {string} name
   */
  constructor(path: any, name: any) {
    this._path = path;
    this.name = name;
    this.kind = "file";
  }

  _path;

  async getFile() {
    await fs.stat(this._path).catch((err) => {
      if (err.code === "ENOENT") throw new DOMException(...GONE);
    });
    return fileFrom(this._path);
  }

  isSameEntry(other: any) {
    return this._path === this.#getPath.apply(other);
  }

  // @ts-expect-error ts-migrate(18022) FIXME: A method cannot be named with a private identifier... Remove this comment to see the full error message
  #getPath() {
    return this._path;
  }

  async createWritable() {
    const fileHandle = await fs.open(this._path, "r+").catch((err) => {
      if (err.code === "ENOENT") throw new DOMException(...GONE);
      throw err;
    });
    const { size } = await fileHandle.stat();
    return new Sink(fileHandle, size);
  }
}

export class FolderHandle {
  kind: any;
  name: any;
  /** @param {string} path */
  constructor(path: any, name = "") {
    this.name = name;
    this.kind = "directory";
    this._path = path;
  }

  _path = "";

  isSameEntry(other: any) {
    return this._path === other._path;
  }

  async *entries() {
    const dir = this._path;
    const items = await fs.readdir(dir).catch((err) => {
      if (err.code === "ENOENT") throw new DOMException(...GONE);
      throw err;
    });
    for (const name of items) {
      const path = join(dir, name);
      const stat = await fs.lstat(path);
      if (stat.isFile()) {
        yield [name, new FileHandle(path, name)];
      } else if (stat.isDirectory()) {
        yield [name, new FolderHandle(path, name)];
      }
    }
  }

  async getDirectoryHandle(name: any, opts = {}) {
    const path = join(this._path, name);
    const stat = await fs.lstat(path).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
    const isDirectory = (stat as any)?.isDirectory();
    if (stat && isDirectory) return new FolderHandle(path, name);
    if (stat && !isDirectory) throw new DOMException(...MISMATCH);
    if (!(opts as any).create) throw new DOMException(...GONE);
    await fs.mkdir(path);
    return new FolderHandle(path, name);
  }

  async getFileHandle(name: any, opts = {}) {
    const path = join(this._path, name);
    const stat = await fs.lstat(path).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
    const isFile = (stat as any)?.isFile();
    if (stat && isFile) return new FileHandle(path, name);
    if (stat && !isFile) throw new DOMException(...MISMATCH);
    if (!(opts as any).create) throw new DOMException(...GONE);
    await (await fs.open(path, "w")).close();
    return new FileHandle(path, name);
  }

  async queryPermission() {
    return "granted";
  }

  /**
   * @param {string} name
   * @param {{ recursive: boolean; }} opts
   */
  async removeEntry(name: any, opts: any) {
    const path = join(this._path, name);
    const stat = await fs.lstat(path).catch((err) => {
      if (err.code === "ENOENT") throw new DOMException(...GONE);
      throw err;
    });
    if (stat.isDirectory()) {
      if (opts.recursive) {
        await fs.rm(path, { recursive: true }).catch((err) => {
          if (err.code === "ENOTEMPTY") throw new DOMException(...MOD_ERR);
          throw err;
        });
      } else {
        await fs.rmdir(path).catch((err) => {
          if (err.code === "ENOTEMPTY") throw new DOMException(...MOD_ERR);
          throw err;
        });
      }
    } else {
      await fs.unlink(path);
    }
  }
}

export default (path: any) => new FolderHandle(path);
