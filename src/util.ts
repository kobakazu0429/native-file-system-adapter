import { WritableStream } from "web-streams-polyfill";
import {
  FolderHandle as MemoryFolderHandle,
  FileHandle as MemoryFileHandle,
} from "./adapters/memory";
import {
  FolderHandle as SandboxFolderHandle,
  FileHandle as SandboxFileHandle,
} from "./adapters/sandbox";
import { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import FileSystemFileHandle from "./FileSystemFileHandle";

export const errors = {
  INVALID: "[InvalidStateError] seeking position failed.",
  GONE: "[NotFoundError] A requested file or directory could not be found at the time an operation was processed.",
  MISMATCH:
    "[TypeMismatchError] The path supplied exists, but was not an entry of requested type.",
  MOD_ERR:
    "[InvalidModificationError] The object can not be modified in this way.",
  SYNTAX: (m: any) =>
    `[SyntaxError] Failed to execute 'write' on 'UnderlyingSinkBase': Invalid params passed. ${m}`,
  SECURITY:
    "[SecurityError] It was determined that certain files are unsafe for access within a Web application, or that too many calls are being made on file resources.",
  DISALLOWED:
    "[NotAllowedError] The request is not allowed by the user agent or the platform in the current context.",
};

export const config = {
  writable: WritableStream,
};

export async function fromDataTransfer(entries: any) {
  console.warn(
    "deprecated fromDataTransfer - use `dt.items[0].getAsFileSystemHandle()` instead"
  );

  const folder = new MemoryFolderHandle("", false);
  folder._entries = entries.map((entry: any) =>
    entry.isFile
      ? new SandboxFileHandle(entry, false)
      : new SandboxFolderHandle(entry, false)
  );

  return new FileSystemDirectoryHandle(folder);
}

export async function fromInput(input: HTMLInputElement) {
  const files = Array.from(input.files);
  if (input.webkitdirectory) {
    const rootName = files[0].webkitRelativePath.split("/", 1)[0];
    const root = new MemoryFolderHandle(rootName, false);
    files.forEach((file) => {
      const path = file.webkitRelativePath.split("/");
      path.shift();
      const name = path.pop();
      const dir = path.reduce((dir: any, path: any) => {
        if (!dir._entries[path])
          dir._entries[path] = new MemoryFolderHandle(path, false);
        return dir._entries[path];
      }, root);
      dir._entries[name] = new MemoryFileHandle(file.name, file, false);
    });
    return new FileSystemDirectoryHandle(root);
  } else {
    const files = Array.from(input.files).map(
      (file) =>
        new FileSystemFileHandle(new MemoryFileHandle(file.name, file, false))
    );
    if (input.multiple) {
      return files;
    } else {
      return files[0];
    }
  }
}
