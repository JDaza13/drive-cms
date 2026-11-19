// Shapes shared by the API (core/, api/, functions/) and the site (src/).
// Keep this file free of runtime code so the browser bundle only gets types.

/** A Google Doc becomes a "post"; an image file becomes an "image". */
export type FeedItemKind = "post" | "image";

export type FeedItem = {
  id: string;
  kind: FeedItemKind;
  /** File name in Drive, without the extension for images. */
  title: string;
  /** ISO 8601 timestamps from Drive. */
  createdTime: string;
  modifiedTime: string;
  /** Drive's "Description" field (file details panel), if filled in. */
  description?: string;
  /** Posts only: the Doc exported as Markdown. */
  markdown?: string;
  /** Images only: same-origin URL served by /api/file. */
  imageUrl?: string;
};

/** "drive" when read from the real folder, "demo" for built-in sample data. */
export type FeedSource = "drive" | "demo";

export type FeedResponse = {
  source: FeedSource;
  generatedAt: string;
  items: FeedItem[];
};

export type ApiError = { error: string };
