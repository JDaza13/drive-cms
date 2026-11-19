// Google Docs' Markdown export embeds every picture as a base64 data URL,
// usually as reference definitions at the end:
//   ![][image1]
//   [image1]: <data:image/png;base64,iVBORw0…>
// Left in place, they make the feed JSON grow with every photo (and Vercel
// caps responses at 4.5 MB). The feed swaps each one for a link to
// /api/doc-image, which re-exports the Doc and returns just that picture.

const DATA_IMAGE = /data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/=]+)/g;

export type InlineImage = { mimeType: string; base64: string };

/** The pictures embedded in exported Markdown, in document order. */
export function findInlineImages(markdown: string): InlineImage[] {
  return [...markdown.matchAll(DATA_IMAGE)].map(([, mimeType, base64]) => ({ mimeType, base64 }));
}

/**
 * Replaces each embedded picture with `/api/doc-image?doc=<id>&n=<index>&v=<version>`.
 * `version` changes when the Doc is edited, so cached pictures never go stale.
 */
export function linkInlineImages(markdown: string, docId: string, version: string): string {
  let n = 0;
  return markdown.replace(DATA_IMAGE, () => {
    const params = new URLSearchParams({ doc: docId, n: String(n++), v: version });
    return `/api/doc-image?${params}`;
  });
}

/** A short cache-busting token from the Doc's modifiedTime. */
export const versionOf = (modifiedTime: string) => Date.parse(modifiedTime).toString(36);

export function decodeBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
