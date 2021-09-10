import type {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
} from "../src/es6";

export function streamFromFetch(data) {
  return new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(data);
      ctrl.close();
    },
  });
}

export function assert(r: boolean, msg = "Assertion failed") {
  if (!r) throw new Error(msg);
}

export function capture(p: any): Promise<Error> {
  return p.catch((_: Error) => _);
}

export async function cleanupSandboxedFileSystem(
  root: FileSystemDirectoryHandle
) {
  for await (const [name, entry] of root) {
    await root.removeEntry(name, { recursive: entry.kind === "directory" });
  }
}

export async function getFileSize(handle: FileSystemFileHandle) {
  const file = await handle.getFile();
  return file.size;
}

export async function getFileContents(handle: FileSystemFileHandle) {
  const file = await handle.getFile();
  return file.text();
}

export async function getDirectoryEntryCount(
  handle: FileSystemDirectoryHandle
) {
  let result = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of handle.entries()) {
    result++;
  }
  return result;
}

export async function createEmptyFile(
  name: string,
  parent: FileSystemDirectoryHandle
) {
  const handle = await parent.getFileHandle(name, { create: true });
  // Make sure the file is empty.
  assert((await getFileSize(handle)) === 0);
  return handle;
}

export async function createFileWithContents(
  fileName: string,
  contents: string,
  parent: FileSystemDirectoryHandle
) {
  const handle = await createEmptyFile(fileName, parent);
  const Writable = await handle.createWritable();
  await Writable.write(contents);
  await Writable.close();
  return handle;
}

export async function getSortedDirectoryEntries(
  handle: FileSystemDirectoryHandle
): Promise<string[]> {
  const result = [];
  for await (const [name, entry] of handle) {
    result.push(name + (entry.kind === "directory" ? "/" : ""));
  }
  result.sort();
  return result;
}

export async function createDirectory(
  name: string,
  parent: FileSystemDirectoryHandle
) {
  return parent.getDirectoryHandle(name, { create: true });
}
