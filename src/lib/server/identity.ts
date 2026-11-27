import "server-only";

export function normalizePhone(value: string) {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  return raw.startsWith("+") ? `+${digits}` : digits;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
