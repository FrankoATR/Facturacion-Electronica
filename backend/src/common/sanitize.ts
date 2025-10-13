export function sanitizeString(input: string): string {
  // Basic OWASP-aligned trimming and whitespace normalization
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "") // control chars
    .replace(/[\t\n\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeOptionalString(input: string | undefined | null): string | undefined {
  if (input == null) return undefined;
  const s = sanitizeString(String(input));
  return s.length ? s : undefined;
}


