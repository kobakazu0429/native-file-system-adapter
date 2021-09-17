export interface ImpleSink<T> {
  fileHandle: T;
  size: number;
  position: number;

  abort: () => Promise<void>;
  write: (chunk: any) => void;
  close: () => Promise<void>;
}

export interface ImpleFileHandle<T = any, U = any> {
  kind: "file";
  path: string;
  name: string;

  getFile: () => Promise<U>;
  isSameEntry: (other: any) => boolean;
  createWritable: () => Promise<T>;
}

export interface ImplFolderHandle<T = any, U = any> {
  kind: "directory";
  path: string;
  name: string;

  queryPermission: () => "granted";
  isSameEntry: (other: any) => boolean;

  entries: () => AsyncGenerator<readonly [string, T | U], void, unknown>;

  getDirectoryHandle: (
    name: string,
    options: { create?: boolean; capture?: boolean }
  ) => Promise<U>;

  getFileHandle: (
    name: string,
    opts: { create?: boolean }
  ) => Promise<T | undefined>;

  removeEntry: (name: string, opts: { recursive?: boolean }) => Promise<void>;
}
