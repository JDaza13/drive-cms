// Runs core/handler.ts against a fake Google API, so the Drive path is tested
// without real credentials.

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { handleApi } from "./handler.js";
import type { FeedResponse } from "./types.js";

const FOLDER = "folder_1234567890";
const MODIFIED = "2026-11-01T00:00:00.000Z";
// 1x1 PNG and GIF, as Google's Markdown export embeds pictures.
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const GIF = "R0lGODlhAQABAAAAACw=";
let serviceAccountJson = "";

beforeAll(async () => {
  const { privateKey } = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", privateKey));
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der))}\n-----END PRIVATE KEY-----\n`;
  serviceAccountJson = JSON.stringify({ client_email: "feed@test.iam.gserviceaccount.com", private_key: pem });
});

afterEach(() => vi.unstubAllGlobals());

const driveEnv = () => ({ GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson, DRIVE_FOLDER_ID: FOLDER });
const get = (path: string, env: Record<string, string>) =>
  handleApi(new Request(`https://site.test${path}`), env);

/** Fake Google: token endpoint plus the Drive calls the handler makes. */
type FakeFile = { name: string; mimeType: string; parents: string[]; markdown?: string };

function stubGoogle(files: Record<string, FakeFile>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : input);
      calls.push(`${url.pathname}${url.search}`);
      if (url.hostname === "oauth2.googleapis.com") {
        const body = new URLSearchParams(String(init?.body));
        const [, claims] = (body.get("assertion") ?? "").split(".");
        const { iss, scope } = JSON.parse(atob(claims.replace(/-/g, "+").replace(/_/g, "/")));
        expect(iss).toBe("feed@test.iam.gserviceaccount.com");
        expect(scope).toBe("https://www.googleapis.com/auth/drive.readonly");
        return Response.json({ access_token: "token-1", expires_in: 3600 });
      }
      const auth = new Headers(init?.headers).get("authorization");
      if (auth !== "Bearer token-1") return new Response("unauthorized", { status: 401 });

      const path = url.pathname.replace("/drive/v3/files", "");
      if (path === "") {
        const list = Object.entries(files).map(([id, f]) => ({
          id,
          name: f.name,
          mimeType: f.mimeType,
          createdTime: "2026-11-01T00:00:00.000Z",
          modifiedTime: MODIFIED,
        }));
        return Response.json({ files: list });
      }
      const [, id, action] = path.split("/");
      const file = files[decodeURIComponent(id)];
      if (!file) return new Response("not found", { status: 404 });
      if (action === "export") return new Response(file.markdown ?? `# ${file.name}\n\nBody`);
      if (url.searchParams.get("alt") === "media") return new Response("IMAGE_BYTES");
      return Response.json({ id, name: file.name, mimeType: file.mimeType, parents: file.parents });
    }),
  );
  return calls;
}

describe("demo source", () => {
  it("serves sample items when Drive isn't configured", async () => {
    const response = await get("/api/feed", {});
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    const body = (await response.json()) as FeedResponse;
    expect(body.source).toBe("demo");
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("returns 503 when FEED_SOURCE=drive but settings are missing", async () => {
    const response = await get("/api/feed", { FEED_SOURCE: "drive" });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Feed is not configured" });
  });
});

describe("drive source", () => {
  const files = {
    doc_1234567890: {
      name: "Opening hours",
      mimeType: "application/vnd.google-apps.document",
      parents: [FOLDER],
    },
    img_1234567890: { name: "Storefront.jpg", mimeType: "image/jpeg", parents: [FOLDER] },
    pdf_1234567890: { name: "Menu.pdf", mimeType: "application/pdf", parents: [FOLDER] },
    other_12345678: { name: "Elsewhere.png", mimeType: "image/png", parents: ["another_folder"] },
  };

  it("lists the folder and exports Docs as Markdown", async () => {
    const calls = stubGoogle({ doc_1234567890: files.doc_1234567890, img_1234567890: files.img_1234567890 });
    const response = await get("/api/feed", { ...driveEnv(), FEED_CACHE_SECONDS: "120" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=120, stale-while-revalidate=1440",
    );
    const body = (await response.json()) as FeedResponse;
    expect(body.source).toBe("drive");
    expect(body.items).toEqual([
      expect.objectContaining({ id: "doc_1234567890", kind: "post", markdown: "# Opening hours\n\nBody" }),
      expect.objectContaining({
        id: "img_1234567890",
        kind: "image",
        title: "Storefront",
        imageUrl: "/api/file?id=img_1234567890",
      }),
    ]);
    const list = new URL(`https://x${calls.find((c) => c.startsWith("/drive/v3/files?"))}`).searchParams.get("q");
    expect(list).toContain(`'${FOLDER}' in parents and trashed=false`);
  });

  it("serves images that live in the folder", async () => {
    stubGoogle(files);
    const response = await get("/api/file?id=img_1234567890", driveEnv());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(await response.text()).toBe("IMAGE_BYTES");
  });

  it.each([
    ["outside the folder", "other_12345678", 404],
    ["not an image", "pdf_1234567890", 404],
    ["unknown", "missing_123456", 404],
    ["malformed", "../etc", 400],
  ])("refuses files that are %s", async (_label, id, status) => {
    stubGoogle(files);
    const response = await get(`/api/file?id=${encodeURIComponent(id)}`, driveEnv());
    expect(response.status).toBe(status);
  });

  it("hides Google errors from visitors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota exceeded", { status: 500 })));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await get("/api/feed", {
      ...driveEnv(),
      // A different account, so no cached token from earlier tests.
      GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson.replace("feed@", "other@"),
    });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("quota");
    spy.mockRestore();
  });
});

describe("pictures inside Docs", () => {
  const files: Record<string, FakeFile> = {
    doc_1234567890: {
      name: "With photos",
      mimeType: "application/vnd.google-apps.document",
      parents: [FOLDER],
      markdown: `Intro\n\n![][image1]\n\nMiddle ![](data:image/gif;base64,${GIF})\n\n[image1]: <data:image/png;base64,${PNG}>`,
    },
    out_doc_123456: {
      name: "Elsewhere",
      mimeType: "application/vnd.google-apps.document",
      parents: ["another_folder"],
      markdown: `![](data:image/png;base64,${PNG})`,
    },
    img_1234567890: { name: "Photo.jpg", mimeType: "image/jpeg", parents: [FOLDER] },
  };

  it("replaces embedded pictures with links in the feed", async () => {
    stubGoogle({ doc_1234567890: files.doc_1234567890 });
    const body = (await (await get("/api/feed", driveEnv())).json()) as FeedResponse;
    const v = Date.parse(MODIFIED).toString(36);
    expect(body.items[0].markdown).toBe(
      `Intro\n\n![][image1]\n\nMiddle ![](/api/doc-image?doc=doc_1234567890&n=0&v=${v})` +
        `\n\n[image1]: </api/doc-image?doc=doc_1234567890&n=1&v=${v}>`,
    );
  });

  it("serves each picture by its position", async () => {
    stubGoogle(files);
    const gif = await get("/api/doc-image?doc=doc_1234567890&n=0&v=x", driveEnv());
    expect(gif.status).toBe(200);
    expect(gif.headers.get("content-type")).toBe("image/gif");
    expect(gif.headers.get("cache-control")).toContain("s-maxage=86400");
    expect(new Uint8Array(await gif.arrayBuffer())).toEqual(
      Uint8Array.from(atob(GIF), (c) => c.charCodeAt(0)),
    );
    const png = await get("/api/doc-image?doc=doc_1234567890&n=1", driveEnv());
    expect(png.headers.get("content-type")).toBe("image/png");
    expect((await png.arrayBuffer()).byteLength).toBe(atob(PNG).length);
  });

  it.each([
    ["a position past the last picture", "doc=doc_1234567890&n=2", 404],
    ["a Doc outside the folder", "doc=out_doc_123456&n=0", 404],
    ["a file that isn't a Doc", "doc=img_1234567890&n=0", 404],
    ["a negative position", "doc=doc_1234567890&n=-1", 400],
    ["no position", "doc=doc_1234567890", 400],
    ["a malformed id", "doc=..%2Fx&n=0", 400],
  ])("refuses %s", async (_label, query, status) => {
    stubGoogle(files);
    expect((await get(`/api/doc-image?${query}`, driveEnv())).status).toBe(status);
  });
});

describe("routing", () => {
  it("rejects other methods and unknown paths", async () => {
    expect((await handleApi(new Request("https://site.test/api/feed", { method: "POST" }), {})).status).toBe(405);
    expect((await get("/api/nope", {})).status).toBe(404);
  });
});
