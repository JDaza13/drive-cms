// Settings that are the same in every language. Text lives in src/i18n/.

/** Placeholder: replace with the business name once it's decided. */
export const brand = "Drive CMS";

export const contact = {
  phone: "+57 316 697 6348",
  /** WhatsApp number in international format, digits only. */
  whatsapp: "573166976348",
};

/** Topics a visitor can pick in the contact form, in display order. */
export const topicIds = ["info", "quote", "other"] as const;
export type TopicId = (typeof topicIds)[number];

export const feedUrl = "/api/feed";

export function whatsappLink(message: string) {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
