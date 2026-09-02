/** Client-generated ids so records are safe to create offline and upsert idempotently once synced. */
export function createId(): string {
  return crypto.randomUUID()
}
