// Shape every language file must follow. If you add a key here, TypeScript
// points at each language file that still needs the translation.

import type { TopicId } from "../config";

export type ContactRequest = { name: string; topic: TopicId; message: string };

export type Messages = {
  meta: { title: string; description: string };
  nav: { label: string; feed: string; contact: string };
  language: { label: string };
  cta: {
    /** Short label for the header button. */
    whatsapp: string;
    seeFeed: string;
    /** Pre-filled WhatsApp message for the header and hero buttons. */
    whatsappMessage: string;
  };
  hero: { eyebrow: string; title: string; text: string };
  feed: {
    title: string;
    text: string;
    loading: string;
    error: string;
    retry: string;
    empty: string;
    /** Shown while the feed serves sample data instead of Drive. */
    demoNotice: string;
    readMore: string;
    readLess: string;
    /** Prefix for the date a document was edited, e.g. "Updated". */
    updated: string;
  };
  contact: {
    title: string;
    text: string;
    name: string;
    topic: string;
    topics: Record<TopicId, string>;
    message: string;
    messagePlaceholder: string;
    submit: string;
    /** Note under the button: the form opens WhatsApp, nothing is stored. */
    privacy: string;
    errors: { name: string; message: string };
    /** Text sent to WhatsApp, written in the visitor's language. */
    whatsappMessage: (request: ContactRequest & { topicLabel: string }) => string;
  };
  footer: { poweredBy: string };
};
