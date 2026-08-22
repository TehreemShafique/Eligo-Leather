import { getPolicyPageContent } from "@/modules/content/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { buildSeoMetadata } from "@/lib/seo"
import { PolicyContentPage } from "@/components/policy/policy-content-page"

export const revalidate = 60

export const metadata = buildSeoMetadata({ title: "Terms of Service", description: "Read the terms governing use of the Eligo Leather website, customer accounts, product orders, payments, delivery, intellectual property and liability.", path: "/terms-of-service", keywords: ["Eligo Leather terms", "online store terms Pakistan"] })

export default async function TermsOfServicePage() {
  // Content is managed by the admin (Settings -> Policies & Privacy, with the
  // Online Stores -> Pages page as fallback) and served from the database.
  const { title, content } = await getPolicyPageContent("terms_of_service", "terms-of-service")

  return (
    <PolicyContentPage
      label="Terms of Service"
      title={title || "Terms of Service"}
      html={sanitizeCmsHtml(content)}
    />
  )
}
