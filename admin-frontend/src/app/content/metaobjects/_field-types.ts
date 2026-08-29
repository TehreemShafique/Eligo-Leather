export const CATEGORIZED_FIELD_TYPES = [
  {
    category: "Recommended",
    types: [
      { name: "Single line text", desc: "Short titles or codes" },
      { name: "Multi-line text", desc: "Paragraph descriptions" },
      { name: "Integer", desc: "Whole numbers" },
      { name: "Image (File)", desc: "Product & fabric photo uploads" },
      { name: "Metaobject", desc: "Reference another custom metaobject schema" },
    ],
  },
  {
    category: "Text",
    types: [
      { name: "Single line text", desc: "Names, badges, tags" },
      { name: "Multi-line text", desc: "Plain text paragraphs" },
      { name: "Rich text", desc: "Formatted HTML text with bold & bullet points" },
      { name: "Choice list (Single line text)", desc: "Pre-defined dropdown choices" },
      { name: "Email (Single line text)", desc: "Validated email addresses" },
    ],
  },
  {
    category: "Media",
    types: [
      { name: "File", desc: "PDFs or generic documents" },
      { name: "Image (File)", desc: "JPEG, PNG, WEBP images" },
      { name: "Video (File)", desc: "MP4 or WebM video files" },
    ],
  },
  {
    category: "Reference",
    types: [
      { name: "Product", desc: "Link store products" },
      { name: "Collection", desc: "Reference product collections" },
      { name: "Metaobject", desc: "Nested metaobject entries" },
    ],
  },
  {
    category: "Number",
    types: [
      { name: "Integer", desc: "Whole count numbers" },
      { name: "Decimal", desc: "Floating point numbers" },
      { name: "Money", desc: "Currency values with decimals" },
    ],
  },
  {
    category: "Link",
    types: [
      { name: "URL", desc: "External website URL" },
      { name: "Link", desc: "Internal store navigation link" },
    ],
  },
  {
    category: "Date and time",
    types: [
      { name: "Date", desc: "Calendar date (YYYY-MM-DD)" },
      { name: "Date and time", desc: "Exact timestamp" },
    ],
  },
  {
    category: "Other",
    types: [
      { name: "True or false", desc: "Boolean checkbox" },
      { name: "Color", desc: "Hex color code (#A52A2A)" },
    ],
  },
]