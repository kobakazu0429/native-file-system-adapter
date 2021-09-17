import { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";
import type node from "./adapters/node";
import type memory from "./adapters/memory";

export async function getOriginPrivateDirectory(
  driver: typeof node | typeof memory,
  path = ""
): Promise<FileSystemDirectoryHandle> {
  return new FileSystemDirectoryHandle(driver(path));
}
