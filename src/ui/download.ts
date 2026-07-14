// Browser-only download helper (ui layer — domain stays free of DOM APIs).

/** Serialize `data` to pretty JSON and trigger a file download. */
export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // Attach + deferred revoke: Safari/iOS can abort the download if the blob URL is
  // revoked synchronously, and older engines ignore clicks on detached anchors.
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
