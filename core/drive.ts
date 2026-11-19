// Drive API v3 calls the feed needs: list a folder, export a Doc as Markdown
// and stream an image. Plain fetch, so it runs on any host.

import { linkInlineImages, versionOf } from "./doc-images.js";
import type { FeedItem } from "./types.js";

const API = "https://www.googleapis.com/drive/v3";
export const GOOGLE_DOC = "application/vnd.google-apps.document";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  description?: string;
  parents?: string[];
};

export class DriveError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function driveFetch(token: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new DriveError(`Drive ${path} failed: ${await response.text()}`, response.status);
  }
  return response;
}

export const isImageType = (mimeType: string) => IMAGE_TYPES.includes(mimeType);
export const isDoc = (mimeType: string) => mimeType === GOOGLE_DOC;

/** Newest Docs and images directly inside the folder (no subfolders). */
export async function listFolder(token: string, folderId: string, limit: number) {
  const mimeFilter = [GOOGLE_DOC, ...IMAGE_TYPES].map((t) => `mimeType='${t}'`).join(" or ");
  const response = await driveFetch(token, "/files", {
    q: `'${folderId}' in parents and trashed=false and (${mimeFilter})`,
    orderBy: "createdTime desc",
    pageSize: String(limit),
    fields: "files(id,name,mimeType,createdTime,modifiedTime,description)",
    // Also works when the folder lives in a shared drive.
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const { files } = (await response.json()) as { files: DriveFile[] };
  return files;
}

export async function exportMarkdown(token: string, fileId: string) {
  const response = await driveFetch(token, `/files/${encodeURIComponent(fileId)}/export`, {
    mimeType: "text/markdown",
  });
  return response.text();
}

export async function getFile(token: string, fileId: string) {
  const response = await driveFetch(token, `/files/${encodeURIComponent(fileId)}`, {
    fields: "id,name,mimeType,createdTime,modifiedTime,parents",
    supportsAllDrives: "true",
  });
  return (await response.json()) as DriveFile;
}

export async function downloadFile(token: string, fileId: string) {
  return driveFetch(token, `/files/${encodeURIComponent(fileId)}`, {
    alt: "media",
    supportsAllDrives: "true",
  });
}

const stripExtension = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, "");

/** Drive files to feed items; Docs are exported in parallel. */
export async function toFeedItems(token: string, files: DriveFile[]): Promise<FeedItem[]> {
  return Promise.all(
    files.map(async (file): Promise<FeedItem> => {
      const base = {
        id: file.id,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        ...(file.description ? { description: file.description } : {}),
      };
      if (file.mimeType === GOOGLE_DOC) {
        return {
          ...base,
          kind: "post",
          title: file.name,
          markdown: linkInlineImages(
            await exportMarkdown(token, file.id),
            file.id,
            versionOf(file.modifiedTime),
          ),
        };
      }
      return {
        ...base,
        kind: "image",
        title: stripExtension(file.name),
        imageUrl: `/api/file?id=${encodeURIComponent(file.id)}`,
      };
    }),
  );
}
