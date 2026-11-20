export interface SafeJsonResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  rawText?: string;
}

export async function safeReadJsonResponse<T = any>(
  res: Response,
  fallbackErrorMsg = 'Service temporairement indisponible. Veuillez réessayer.'
): Promise<SafeJsonResult<T>> {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    return {
      ok: false,
      status: res.status || 0,
      data: null,
      error: fallbackErrorMsg,
    };
  }

  let parsed: any = null;
  if (rawText && rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (parsed && typeof parsed === 'object') {
    if (!res.ok) {
      const apiErr =
        typeof parsed.error === 'string' && parsed.error.trim()
          ? parsed.error.trim()
          : typeof parsed.message === 'string' && parsed.message.trim()
          ? parsed.message.trim()
          : fallbackErrorMsg;
      return {
        ok: false,
        status: res.status,
        data: parsed as T,
        error: apiErr,
        rawText,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsed as T,
      error: null,
      rawText,
    };
  }

  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();
  const isHtmlOrVercelNotFound =
    res.status === 404 ||
    lower.startsWith('the page could not be found') ||
    lower.startsWith('<!doctype') ||
    lower.startsWith('<html') ||
    lower.includes('not_found');

  return {
    ok: false,
    status: res.status || 500,
    data: null,
    error: isHtmlOrVercelNotFound
      ? fallbackErrorMsg
      : trimmed && trimmed.length < 180
      ? trimmed
      : fallbackErrorMsg,
    rawText,
  };
}
