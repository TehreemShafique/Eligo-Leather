import { getPolicyPageContent } from "@/modules/content/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { buildSeoMetadata } from "@/lib/seo"
import { PolicyContentPage } from "@/components/policy/policy-content-page"

export const revalidate = 60

export const metadata = buildSeoMetadata({ title: "Privacy Policy", description: "Learn how Eligo Leather collects, uses, stores and protects customer information when you browse our website, place orders or contact our support team.", path: "/privacy-policy", keywords: ["Eligo Leather privacy policy", "customer data protection"] })

export default async function PrivacyPolicyPage() {
  // Content is managed by the admin (Settings -> Policies & Privacy, with the
  // Online Stores -> Pages page as fallback) and served from the database.
  const { title, content } = await getPolicyPageContent("privacy_policy", "privacy-policy")

  return (
    <PolicyContentPage
      label="Privacy Policy"
      title={title || "Privacy Policy"}
      html={sanitizeCmsHtml(content)}
    />
  )
}
