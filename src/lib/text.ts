const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const HTML_ENTITY_PATTERN = /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi;

export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const includesAnyNormalized = (value: string, terms: string[]) => {
  const normalizedValue = normalizeText(value);
  return terms.some((term) => normalizedValue.includes(normalizeText(term)));
};

/** Decodes text entities while keeping the result as plain React text. */
export function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY_PATTERN, (entity, token: string) => {
    const normalized = token.toLowerCase();
    if (!normalized.startsWith("#")) return HTML_ENTITIES[normalized] ?? entity;

    const radix = normalized.startsWith("#x") ? 16 : 10;
    const digits = normalized.slice(radix === 16 ? 2 : 1);
    const codePoint = Number.parseInt(digits, radix);
    if (!Number.isFinite(codePoint) || codePoint > 0x10ffff) return entity;

    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return entity;
    }
  });
}
