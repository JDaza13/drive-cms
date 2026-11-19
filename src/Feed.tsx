import { useCallback, useEffect, useState } from "react";
import type { FeedItem, FeedResponse } from "../core/types";
import { feedUrl } from "./config";
import { useI18n } from "./i18n/context";
import { languages } from "./i18n/languages";
import { Markdown } from "./Markdown";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; feed: FeedResponse };

/** Posts longer than this start collapsed behind "Read more". */
const LONG_POST = 700;

function useFeed() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(feedUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Feed responded ${response.status}`);
        return response.json() as Promise<FeedResponse>;
      })
      .then((feed) => setState({ status: "ready", feed }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setState({ status: "error" });
        }
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}

function FeedDate({ item }: { item: FeedItem }) {
  const { language, t } = useI18n();
  const format = new Intl.DateTimeFormat(languages[language].htmlLang, { dateStyle: "long" });
  const created = new Date(item.createdTime);
  const modified = new Date(item.modifiedTime);
  // Only mention edits made at least a day after publishing.
  const edited = modified.getTime() - created.getTime() > 86_400_000;
  return (
    <p className="text-[13px] text-muted">
      <time dateTime={item.createdTime}>{format.format(created)}</time>
      {edited && (
        <>
          {" · "}
          {t.feed.updated} <time dateTime={item.modifiedTime}>{format.format(modified)}</time>
        </>
      )}
    </p>
  );
}

function PostCard({ item }: { item: FeedItem }) {
  const { t } = useI18n();
  const long = (item.markdown?.length ?? 0) > LONG_POST;
  const [expanded, setExpanded] = useState(false);
  const bodyId = `post-${item.id}`;

  return (
    <article className="animate-rise rounded-2xl border border-line bg-card p-5 sm:p-7">
      <FeedDate item={item} />
      <h3 className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-balance">
        {item.title}
      </h3>
      {item.description && <p className="mt-2 text-muted">{item.description}</p>}
      {item.markdown && (
        <div
          id={bodyId}
          className={`relative mt-4 ${long && !expanded ? "max-h-72 overflow-hidden" : ""}`}
        >
          <Markdown>{item.markdown}</Markdown>
          {long && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card" />
          )}
        </div>
      )}
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-semibold text-accent hover:underline"
        >
          {expanded ? t.feed.readLess : t.feed.readMore}
        </button>
      )}
    </article>
  );
}

function ImageCard({ item }: { item: FeedItem }) {
  return (
    <figure className="animate-rise overflow-hidden rounded-2xl border border-line bg-card">
      <img
        src={item.imageUrl}
        alt={item.description ?? item.title}
        loading="lazy"
        decoding="async"
        className="aspect-[16/10] w-full bg-accent-soft object-cover"
      />
      <figcaption className="p-5 sm:p-7">
        <FeedDate item={item} />
        <p className="mt-1.5 font-serif text-xl font-semibold leading-snug">{item.title}</p>
        {item.description && <p className="mt-1 text-muted">{item.description}</p>}
      </figcaption>
    </figure>
  );
}

export function Feed() {
  const { t } = useI18n();
  const { state, retry } = useFeed();

  if (state.status === "loading") {
    return (
      <div role="status" className="grid gap-5">
        <span className="sr-only">{t.feed.loading}</span>
        {[0, 1].map((i) => (
          <div key={i} aria-hidden className="h-48 animate-pulse rounded-2xl bg-line/50" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="rounded-2xl border border-line bg-card p-6 text-center">
        <p>{t.feed.error}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
        >
          {t.feed.retry}
        </button>
      </div>
    );
  }

  const { feed } = state;
  return (
    <div className="grid gap-5">
      {feed.source === "demo" && (
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink/80">{t.feed.demoNotice}</p>
      )}
      {feed.items.length === 0 && <p className="text-muted">{t.feed.empty}</p>}
      {feed.items.map((item) =>
        item.kind === "image" ? (
          <ImageCard key={item.id} item={item} />
        ) : (
          <PostCard key={item.id} item={item} />
        ),
      )}
    </div>
  );
}
