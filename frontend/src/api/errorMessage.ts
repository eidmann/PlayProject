export function getApiErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return undefined;
  }

  const data = error.data;
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return undefined;
  }

  const message = data.error;
  return typeof message === 'string' ? message : undefined;
}
