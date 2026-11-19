import type { Messages } from "./types";

export const es: Messages = {
  meta: {
    title: "Drive CMS: novedades publicadas desde Google Drive",
    description:
      "Noticias y novedades que se publican escribiendo un Google Doc en una carpeta de Drive. Escríbenos por WhatsApp.",
  },
  nav: { label: "Principal", feed: "Novedades", contact: "Contacto" },
  language: { label: "Idioma" },
  cta: {
    whatsapp: "WhatsApp",
    seeFeed: "Ver novedades",
    whatsappMessage: "Hola, vi su sitio web y quiero más información.",
  },
  hero: {
    eyebrow: "Publicado desde Google Drive",
    title: "Escribe un documento. Aparece en la página.",
    text: "Cada Google Doc o imagen que se guarda en la carpeta se publica aquí en pocos minutos, sin tocar código ni entrar a un panel.",
  },
  feed: {
    title: "Novedades",
    text: "Lo más reciente de la carpeta, del más nuevo al más antiguo.",
    loading: "Cargando novedades…",
    error: "No pudimos cargar las novedades.",
    retry: "Intentar de nuevo",
    empty: "Todavía no hay publicaciones.",
    demoNotice: "Contenido de ejemplo: el feed aún no está conectado a Google Drive.",
    readMore: "Leer más",
    readLess: "Leer menos",
    updated: "Actualizado",
  },
  contact: {
    title: "Escríbenos",
    text: "Completa los datos y se abrirá WhatsApp con tu mensaje listo para enviar.",
    name: "Tu nombre",
    topic: "Tema",
    topics: {
      info: "Información general",
      quote: "Cotización",
      other: "Otro",
    },
    message: "Mensaje",
    messagePlaceholder: "Cuéntanos qué necesitas",
    submit: "Enviar por WhatsApp",
    privacy: "No guardamos tus datos: el mensaje va directo a WhatsApp.",
    errors: {
      name: "Escribe tu nombre.",
      message: "Cuéntanos un poco más (al menos 10 caracteres).",
    },
    whatsappMessage: ({ name, topicLabel, message }) =>
      `Hola, soy ${name}.\nTema: ${topicLabel}\n\n${message}`,
  },
  footer: { poweredBy: "Contenido publicado desde Google Drive." },
};
