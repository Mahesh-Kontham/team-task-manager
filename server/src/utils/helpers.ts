export function getString(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  if (typeof value === "string") return value;
  return undefined;
}
