// Browser-only file-read helper — the import mirror of download.ts (domain stays DOM-free).

/** Read a user-picked file and parse it as JSON. Rejects on read failure or malformed JSON. */
export async function readJSONFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text) as unknown;
}
