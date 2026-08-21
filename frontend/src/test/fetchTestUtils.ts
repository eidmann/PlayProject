export function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return String(input);
}

export async function getRequestBody(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<string> {
  if (typeof init?.body === 'string') {
    return init.body;
  }
  if (input instanceof Request) {
    return input.clone().text();
  }
  return '';
}

export function parseEntryWriteBody(raw: string) {
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('title' in parsed) ||
    !('content' in parsed) ||
    typeof parsed.title !== 'string' ||
    typeof parsed.content !== 'string'
  ) {
    throw new Error('Invalid JSON body');
  }
  return parsed as { title: string; content: string };
}
