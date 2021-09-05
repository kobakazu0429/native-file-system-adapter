import * as fs from "../src/es6.js";

export function streamFromFetch(data) {
  return new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(data);
      ctrl.close();
    },
  });
}

export function arrayEqual(a1, a2) {
  assert(
    JSON.stringify(a1) === JSON.stringify(a2),
    `expected ${a2} to equal ${a1}`
  );
}

/** @param {boolean} r */
export function assert(r, msg = "Assertion failed") {
  if (!r) throw new Error(msg);
}

export function capture(p) {
  return p.catch((_) => _);
}

/** @param {fs.FileSystemDirectoryHandle} root */
export async function cleanupSandboxedFileSystem(root) {
  for await (const [name, entry] of root) {
    await root.removeEntry(name, { recursive: entry.kind === "directory" });
  }
}

export async function getFileSize(handle) {
  const file = await handle.getFile();
  return file.size;
}

export async function getFileContents(handle) {
  const file = await handle.getFile();
  return file.text();
}

export async function getDirectoryEntryCount(handle) {
  let result = 0;
  for await (let _entry of handle.entries()) {
    result++;
  }
  return result;
}

/**
 * @param {string} name
 * @param {fs.FileSystemDirectoryHandle} parent
 */
export async function createEmptyFile(name, parent) {
  const handle = await parent.getFileHandle(name, { create: true });
  // Make sure the file is empty.
  assert((await getFileSize(handle)) === 0);
  return handle;
}

/**
 * @param {string} fileName
 * @param {string} contents
 * @param {fs.FileSystemDirectoryHandle} parent
 */
export async function createFileWithContents(fileName, contents, parent) {
  const handle = await createEmptyFile(fileName, parent);
  const Writable = await handle.createWritable();
  await Writable.write(contents);
  await Writable.close();
  return handle;
}

/**
 * @param {fs.FileSystemDirectoryHandle} handle
 * @returns {Promise<string[]>}
 */
export async function getSortedDirectoryEntries(handle) {
  const result = [];
  for await (const [name, entry] of handle) {
    result.push(name + (entry.kind === "directory" ? "/" : ""));
  }
  result.sort();
  return result;
}

/**
 * @param {string} name
 * @param {fs.FileSystemDirectoryHandle} parent
 */
export async function createDirectory(name, parent) {
  return parent.getDirectoryHandle(name, { create: true });
}
