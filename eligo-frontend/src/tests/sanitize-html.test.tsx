import { describe, expect, it } from "vitest"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"

describe("sanitizeCmsHtml", () => {
  it("removes script tags and their content", () => {
    const dirty = '<p>Safe</p><script>alert("xss")</script>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).not.toMatch(/<script/i)
    expect(clean).not.toContain("alert(")
    expect(clean).toContain("<p>Safe</p>")
  })

  it("strips onerror handlers from images", () => {
    const dirty = '<img src="https://example.com/a.png" onerror="alert(1)">'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain("<img")
    expect(clean).toContain('src="https://example.com/a.png"')
    expect(clean).not.toContain("onerror")
  })

  it("strips onclick handlers from elements", () => {
    const dirty = '<strong onclick="alert(1)">Bold text</strong>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain("<strong>Bold text</strong>")
    expect(clean).not.toContain("onclick")
  })

  it("removes javascript: links", () => {
    const dirty = '<a href="javascript:alert(1)">Click me</a>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).not.toContain("javascript:")
    expect(clean).toContain("Click me")
  })

  it("removes unsafe data: URLs", () => {
    const dirty = '<a href="data:text/html,<script>alert(1)</script>">Bad</a><img src="data:text/html;base64,PHNjcmlwdD4=">'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).not.toContain("data:")
  })

  it("removes iframes, objects, embeds, forms and inputs", () => {
    const dirty =
      '<iframe src="https://evil.example"></iframe><object data="x"></object><embed src="y"><form action="/steal"><input type="text"><button>Go</button></form>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).not.toMatch(/<(iframe|object|embed|form|input|button)/i)
  })

  it("strips inline style attributes", () => {
    const dirty = '<p style="position:fixed;top:0;left:0;width:100%">Styled</p>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain("<p>Styled</p>")
    expect(clean).not.toContain("style=")
  })

  it("blocks protocol-relative URLs", () => {
    const dirty = '<a href="//evil.example/path">Rel</a>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).not.toContain("//evil.example")
  })

  it("keeps safe headings, paragraphs, lists, emphasis and HTTPS links intact", () => {
    const dirty =
      "<h2>Title</h2>" +
      "<p>Paragraph with <strong>bold</strong> and <em>emphasis</em>.</p>" +
      "<ul><li>One</li><li>Two</li></ul>" +
      "<ol><li>First</li></ol>" +
      '<blockquote>Quoted</blockquote>' +
      '<p><a href="https://example.com/page">Safe link</a></p>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain("<h2>Title</h2>")
    expect(clean).toContain("<p>Paragraph with <strong>bold</strong> and <em>emphasis</em>.</p>")
    expect(clean).toContain("<ul>")
    expect(clean).toContain("<li>One</li>")
    expect(clean).toContain("<ol>")
    expect(clean).toContain("<blockquote>Quoted</blockquote>")
    expect(clean).toContain('<a href="https://example.com/page">Safe link</a>')
  })

  it("adds rel=noopener noreferrer only to links that open in a new tab", () => {
    const dirty =
      '<a href="https://example.com" target="_blank">New tab</a><a href="https://example.com/inline">Same tab</a>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">')
    expect(clean).toContain('<a href="https://example.com/inline">')
    expect(clean).not.toContain('rel="noopener noreferrer"><')
  })

  it("allows mailto and tel links plus relative URLs", () => {
    const dirty =
      '<a href="mailto:shop@example.com">Mail</a><a href="tel:+923001234567">Call</a><a href="/products">Shop</a>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain('href="mailto:shop@example.com"')
    expect(clean).toContain('href="tel:+923001234567"')
    expect(clean).toContain('href="/products"')
  })

  it("keeps basic tables while dropping disallowed attributes", () => {
    const dirty = '<table><thead><tr><th colspan="2">H</th></tr></thead><tbody><tr><td>A</td><td>B</td></tr></tbody></table>'
    const clean = sanitizeCmsHtml(dirty)
    expect(clean).toContain("<table>")
    expect(clean).toContain('<th colspan="2">H</th>')
    expect(clean).toContain("<td>A</td>")
  })
})
