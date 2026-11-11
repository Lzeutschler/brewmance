import type { JsonLdObject } from "@/lib/structured-data";

/**
 * Structured data for search engines, rendered in the page body as the Next.js docs recommend. `<` is escaped so
 * no string in the data can close the script tag. The CSP allows inline scripts, so no nonce is needed.
 */
export function JsonLd({ data }: { data: JsonLdObject | readonly JsonLdObject[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
