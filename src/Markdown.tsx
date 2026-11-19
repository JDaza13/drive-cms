import ReactMarkdown, { defaultUrlTransform } from "react-markdown";

// Google Docs' Markdown export embeds pictures as data: URLs. Allow those for
// images only (raster types; an <img> can't run script anyway) and keep
// react-markdown's safe defaults for everything else. Raw HTML in a Doc is
// shown as text, never rendered.
const inlineImage = /^data:image\/(png|jpeg|gif|webp);base64,/i;

function urlTransform(url: string, key: string) {
  if (key === "src" && inlineImage.test(url)) return url;
  return defaultUrlTransform(url);
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="doc">
      <ReactMarkdown
        urlTransform={urlTransform}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
