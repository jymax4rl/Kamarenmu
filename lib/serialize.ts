/** Serialize Mongoose documents / lean objects for JSON */
export function toPlain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
