import { FileSystemDirectoryHandle } from "./FileSystemDirectoryHandle";

async function getOriginPrivateDirectory(
  driver: any,
  options = {}
): Promise<FileSystemDirectoryHandle> {
  if (!driver) {
    return (
      (window.navigator.storage as any).getDirectory() ||
      globalThis.getOriginPrivateDirectory()
    );
  }
  return new FileSystemDirectoryHandle(driver(options));
}

export default getOriginPrivateDirectory;
