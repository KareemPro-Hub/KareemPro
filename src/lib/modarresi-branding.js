// Keep historical contracts and stored IDs intact; rename their display copy.
export function modarresiText(value) {
  if (typeof value !== "string") return value;
  return value.replace(/https?:\/\/[^\s<>"']+|منصة\s+(?:LINK|لينك)\s+السعودية|(?:منصة|باقة)\s+لينك(?=$|[^\p{L}\p{N}_])|\bLINK\b|^لينك$/giu,
    (match) => /^https?:\/\//i.test(match) ? match : /^منصة\s/i.test(match) ? "منصة مُدرسي" : /^باقة\s/.test(match) ? "باقة مُدرسي" : "مُدرسي");
}

export function isModarresi(value) {
  const text = String(value || "").normalize("NFKC").replace(/[\u064B-\u065F\u0670]/g, "");
  return /\bLINK\b|(?:^|[^\p{L}\p{N}_])(?:مدرسي|لينك)(?=$|[^\p{L}\p{N}_])/iu.test(text);
}

const LABEL_FIELDS = new Set([
  "title", "name", "description", "desc", "features", "message", "label", "content", "body", "text",
  "project_title", "package_name", "discount_note", "note", "file_name", "stage_label",
  "projectTitle", "packageName", "stageTitle", "stepTitle", "stepDesc", "fileName",
]);

export function modarresiDisplayData(value) {
  if (Array.isArray(value)) {
    const items = value.map(modarresiDisplayData);
    return items.some((item, i) => item !== value[i]) ? items : value;
  }
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return value;
  let changed = false;
  const entries = Object.entries(value).map(([key, item]) => {
    const next = LABEL_FIELDS.has(key) && typeof item === "string"
      ? modarresiText(item) : modarresiDisplayData(item);
    if (next !== item) changed = true;
    return [key, next];
  });
  return changed ? Object.fromEntries(entries) : value;
}

export async function withModarresiBranding(query) {
  return modarresiDisplayData(await query);
}
