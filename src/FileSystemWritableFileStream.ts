/** @type {typeof WritableStream} */
const ws =
  globalThis.WritableStream ||
  // @ts-expect-error ts-migrate(1378) FIXME: Top-level 'await' expressions are only allowed whe... Remove this comment to see the full error message
  (await import(
    // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'https://cdn.jsdelivr.net/npm/w... Remove this comment to see the full error message
    "https://cdn.jsdelivr.net/npm/web-streams-polyfill@3/dist/ponyfill.es2018.mjs"
  )
    .then((r) => r.WritableStream)
    .catch(() => import("web-streams-polyfill").then((r) => r.WritableStream)));

class FileSystemWritableFileStream extends ws {
  _closed: any;
  constructor(...args: any[]) {
    super(...args);

    // Stupid Safari hack to extend native classes
    // https://bugs.webkit.org/show_bug.cgi?id=226201
    Object.setPrototypeOf(this, FileSystemWritableFileStream.prototype);

    /** @private */
    this._closed = false;
  }
  close() {
    this._closed = true;
    const w = this.getWriter();
    const p = w.close();
    w.releaseLock();
    return p;
    // return super.close ? super.close() : this.getWriter().close()
  }

  /** @param {number} position */
  seek(position: any) {
    return this.write({ type: "seek", position });
  }

  /** @param {number} size */
  truncate(size: any) {
    return this.write({ type: "truncate", size });
  }

  write(data: any) {
    if (this._closed) {
      return Promise.reject(
        new TypeError("Cannot write to a CLOSED writable stream")
      );
    }

    const writer = this.getWriter();
    const p = writer.write(data);
    writer.releaseLock();
    return p;
  }
}

Object.defineProperty(
  FileSystemWritableFileStream.prototype,
  Symbol.toStringTag,
  {
    value: "FileSystemWritableFileStream",
    writable: false,
    enumerable: false,
    configurable: true,
  }
);

Object.defineProperties(FileSystemWritableFileStream.prototype, {
  close: { enumerable: true },
  seek: { enumerable: true },
  truncate: { enumerable: true },
  write: { enumerable: true },
});

export default FileSystemWritableFileStream;
export { FileSystemWritableFileStream };
