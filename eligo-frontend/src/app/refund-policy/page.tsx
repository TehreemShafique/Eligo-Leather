import { getPolicyPageContent } from "@/modules/content/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { buildSeoMetadata } from "@/lib/seo"
import { PolicyContentPage } from "@/components/policy/policy-content-page"

export const revalidate = 60

export const metadata = buildSeoMetadata({ title: "Refund and Return Policy", description: "Review Eligo Leather return, exchange and refund conditions, eligibility requirements, return shipping responsibilities and processing timelines.", path: "/refund-policy", keywords: ["Eligo Leather refund policy", "leather product returns"] })

export default async function RefundPolicyPage() {
  // Content is managed by the admin (Settings -> Policies & Privacy, with the
  // Online Stores -> Pages page as fallback) and served from the database.
  const { title, content } = await getPolicyPageContent("refund_policy", "refund-policy")

  return (
    <PolicyContentPage
      label="Refund Policy"
      title={title || "Refund Policy"}
      html={sanitizeCmsHtml(content)}
    />
  )
}
