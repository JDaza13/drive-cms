import { useId, useState, type FormEvent } from "react";
import { topicIds, whatsappLink, type TopicId } from "./config";
import { useI18n } from "./i18n/context";

type Errors = Partial<Record<"name" | "message", string>>;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none transition focus:border-deep focus:ring-2 focus:ring-deep/15 aria-[invalid=true]:border-accent";

export function ContactForm() {
  const { t } = useI18n();
  const id = useId();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState<TopicId>(topicIds[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = t.contact.errors.name;
    if (message.trim().length < 10) next.message = t.contact.errors.message;
    setErrors(next);
    const firstInvalid = next.name ? "name" : next.message ? "message" : null;
    if (firstInvalid) {
      (e.currentTarget.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      return;
    }
    const text = t.contact.whatsappMessage({
      name: name.trim(),
      topic,
      topicLabel: t.contact.topics[topic],
      message: message.trim(),
    });
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
  };

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5">
      <div>
        <label htmlFor={`${id}-name`} className="text-sm font-semibold">
          {t.contact.name}
        </label>
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          className={fieldClass}
        />
        {errors.name && (
          <p id={`${id}-name-error`} className="mt-1.5 text-sm text-accent">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-topic`} className="text-sm font-semibold">
          {t.contact.topic}
        </label>
        <select
          id={`${id}-topic`}
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as TopicId)}
          className={fieldClass}
        >
          {topicIds.map((topicId) => (
            <option key={topicId} value={topicId}>
              {t.contact.topics[topicId]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${id}-message`} className="text-sm font-semibold">
          {t.contact.message}
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          value={message}
          placeholder={t.contact.messagePlaceholder}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          className={`${fieldClass} resize-y`}
        />
        {errors.message && (
          <p id={`${id}-message-error`} className="mt-1.5 text-sm text-accent">
            {errors.message}
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition hover:bg-accent/90 sm:w-auto"
        >
          {t.contact.submit}
        </button>
        <p className="mt-3 text-sm text-muted">{t.contact.privacy}</p>
      </div>
    </form>
  );
}
