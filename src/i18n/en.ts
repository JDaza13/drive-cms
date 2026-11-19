import type { Messages } from "./types";

export const en: Messages = {
  meta: {
    title: "Drive CMS: updates published from Google Drive",
    description:
      "News and updates published by writing a Google Doc in a Drive folder. Message us on WhatsApp.",
  },
  nav: { label: "Main", feed: "Updates", contact: "Contact" },
  language: { label: "Language" },
  cta: {
    whatsapp: "WhatsApp",
    seeFeed: "See updates",
    whatsappMessage: "Hi, I saw your website and would like more information.",
  },
  hero: {
    eyebrow: "Published from Google Drive",
    title: "Write a document. It shows up on the page.",
    text: "Every Google Doc or image saved in the folder is published here within minutes, with no code and no admin panel.",
  },
  feed: {
    title: "Updates",
    text: "The latest from the folder, newest first.",
    loading: "Loading updates…",
    error: "We couldn't load the updates.",
    retry: "Try again",
    empty: "Nothing has been published yet.",
    demoNotice: "Sample content: the feed isn't connected to Google Drive yet.",
    readMore: "Read more",
    readLess: "Show less",
    updated: "Updated",
  },
  contact: {
    title: "Get in touch",
    text: "Fill in the details and WhatsApp will open with your message ready to send.",
    name: "Your name",
    topic: "Topic",
    topics: {
      info: "General information",
      quote: "Quote",
      other: "Other",
    },
    message: "Message",
    messagePlaceholder: "Tell us what you need",
    submit: "Send on WhatsApp",
    privacy: "We don't store your details: the message goes straight to WhatsApp.",
    errors: {
      name: "Please enter your name.",
      message: "Tell us a bit more (at least 10 characters).",
    },
    whatsappMessage: ({ name, topicLabel, message }) =>
      `Hi, I'm ${name}.\nTopic: ${topicLabel}\n\n${message}`,
  },
  footer: { poweredBy: "Content published from Google Drive." },
};
