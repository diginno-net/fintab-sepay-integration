export function maskError(error: Record<string, unknown> | null): string {
  if (!error) return '';
  const masked = { ...error };
  delete masked.stack;
  delete (masked as Record<string, unknown>).password;
  delete (masked as Record<string, unknown>).api_key;
  delete (masked as Record<string, unknown>).secret;
  return JSON.stringify(masked);
}
