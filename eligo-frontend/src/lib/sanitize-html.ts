import sanitizeHtmlLib from "sanitize-html"

/**
 * Shared sanitizer for untrusted CMS HTML (page content, blog bodies, product
 * descriptions). Explicit allowlist: normal content formatting survives,
 * everything executable or structural is discarded.
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "del",
  "ins",
  "sub",
  "sup",
  "small",
  "mark",
  "code",
  "pre",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "figure",
  "figcaption",
  "span",
  "div",
]

const URL_SCHEMES = ["http", "https", "mailto", "tel"]

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  // `rel` is allowlisted only so the forced value below survives filtering;
  // the transform always overwrites or removes caller-supplied values.
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  ol: ["start"],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
}

export function sanitizeCmsHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: URL_SCHEMES,
    // Image sources are restricted further: no mailto/tel on src.
    allowedSchemesByTag: {
      a: URL_SCHEMES,
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        const safeAttribs = { ...attribs }
        if (safeAttribs.target === "_blank") {
          // Force safe rel values on new-tab links; never trust CMS-supplied ones.
          safeAttribs.rel = "noopener noreferrer"
        } else {
          delete safeAttribs.rel
        }
        return { tagName, attribs: safeAttribs }
      },
    },
  })
}
