// Sample feed served when Drive isn't configured (FEED_SOURCE=demo or no
// credentials), so the site can be developed and previewed before the Google
// setup. The text stands in for documents a business would write in Drive,
// which is why it's Spanish content rather than UI strings.

import type { FeedItem } from "./types.js";

export const demoItems: FeedItem[] = [
  {
    id: "demo-welcome",
    kind: "post",
    title: "Bienvenidos a nuestro nuevo sitio",
    createdTime: "2026-11-17T14:00:00.000Z",
    modifiedTime: "2026-11-17T15:30:00.000Z",
    description: "Ejemplo: así se ve un Google Doc publicado en el feed.",
    markdown: [
      "Este texto **viene de un Google Doc**. Cuando el feed esté conectado a Drive,",
      "cada documento nuevo en la carpeta aparece aquí en pocos minutos.",
      "",
      "## Qué se puede usar",
      "",
      "- Títulos, **negrita** y *cursiva*",
      "- Listas como esta",
      "- Enlaces, por ejemplo a [Google Drive](https://drive.google.com)",
      "",
      "> Las citas también se ven bien.",
    ].join("\n"),
  },
  {
    id: "demo-image",
    kind: "image",
    title: "Una imagen subida a la carpeta",
    createdTime: "2026-11-15T10:00:00.000Z",
    modifiedTime: "2026-11-15T10:00:00.000Z",
    description: "Las imágenes JPG, PNG, WebP o GIF se publican como tarjetas.",
    imageUrl: "/demo/sample-image.svg",
  },
  {
    id: "demo-hours",
    kind: "post",
    title: "Horario de fin de año",
    createdTime: "2026-11-10T09:00:00.000Z",
    modifiedTime: "2026-11-10T09:00:00.000Z",
    markdown: [
      "Del **24 al 26 de diciembre** atendemos solo por WhatsApp.",
      "",
      "1. Escríbenos con tu nombre y lo que necesitas.",
      "2. Te respondemos el mismo día.",
    ].join("\n"),
  },
];
