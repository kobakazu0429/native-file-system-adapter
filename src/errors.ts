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
