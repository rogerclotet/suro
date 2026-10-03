export function releaseForCommit(sha: string): string;
export function currentRelease(
  env?: Record<string, string | undefined>,
): string;
export function requireUploadConfig(
  env?: Record<string, string | undefined>,
): void;
