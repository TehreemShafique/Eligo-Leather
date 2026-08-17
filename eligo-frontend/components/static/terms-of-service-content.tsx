"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export function TermsOfServiceContent() {
  const [dbPolicyHtml, setDbPolicyHtml] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch("http://127.0.0.1:8000/api/v1/settings/legal-privacy/policies")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const found = data.find((p: any) => p.policy_type === "terms_of_service")
          if (found && found.body) {
            setDbPolicyHtml(found.body)
          }
        }
      })
      .catch(() => null)
    return () => {
      isMounted = false
    }
  }, [])
  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope'] text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: "Terms of Service" }]} />
        </div>

        {/* Title Header */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-800 tracking-tight">
            Terms of Service
          </h1>
        </div>

        {dbPolicyHtml ? (
          <div
            className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs mb-12 text-base sm:text-lg text-gray-800 leading-relaxed space-y-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-amber-800 [&_h3]:text-xl [&_h3]:font-bold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-amber-800 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: dbPolicyHtml }}
          />
        ) : (
          <>
            {/* Introduction Box */}
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs mb-12 text-lg text-black font-normal leading-relaxed space-y-4">
              <p>
                Welcome to <strong className="font-bold text-black">Eligoleather.com</strong>. By accessing or using our website and purchasing our products, you agree to comply with and be bound by the following <strong className="font-bold text-black">Terms of Service</strong>. These terms govern your use of our website, services, and any purchases made. Please read these terms carefully before proceeding.
              </p>
              <p>
                This website is operated by <strong className="font-bold text-black">Eligoleather</strong>. Throughout the site, the terms “we,” “us,” and “our” refer to <strong className="font-bold text-black">Eligoleather</strong>. By visiting our site and/or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions.
              </p>
            </div>

        {/* Terms Sections */}
        <div className="space-y-12">
          {/* 1. General Information */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">General Information</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Eligoleather manufactures and sells handcrafted genuine leather products. We reserve the right to refuse service to anyone for any reason at any time.
            </p>
          </div>

          {/* 2. Eligibility */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Eligibility</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              By using our website and placing an order, you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>You are at least 18 years of age.</li>
              <li>You are using this site for personal, non-commercial purposes.</li>
              <li>All information provided by you is accurate and up-to-date.</li>
            </ul>
          </div>

          {/* 3. Products & Services */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Products &amp; Services</h2>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Product Availability:</strong> We strive to ensure that the products displayed on our website are available. However, availability is not guaranteed, and we reserve the right to limit or discontinue any product at any time without notice.
              </p>
              <p>
                <strong className="font-bold text-black">Product Descriptions:</strong> We make every effort to ensure that product descriptions, images, and prices are accurate. However, we do not guarantee that all content is free from errors, omissions, or inaccuracies.
              </p>
              <p>
                <strong className="font-bold text-black">Custom &amp; Personalized Items:</strong> Some of our products may be customized or personalized. Once these orders are placed and production begins, they are final and cannot be canceled or returned, except for cases involving defects or errors on our part.
              </p>
            </div>
          </div>

          {/* 4. Pricing & Payment */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Pricing &amp; Payment</h2>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Prices:</strong> All prices are listed in <strong className="font-bold text-black">PKR (Rs.)</strong> and may be subject to change without notice. The price at checkout is the final price.
              </p>
              <p>
                <strong className="font-bold text-black">Payment:</strong> We accept various forms of payment, including Cash on Delivery (COD), major credit cards, and online banking processors. Payment must be authorized before your order is processed and shipped.
              </p>
              <p>
                <strong className="font-bold text-black">Promotions:</strong> Any discounts, promotions, or special offers are subject to their specific terms and conditions. We reserve the right to modify or cancel promotions at any time without prior notice.
              </p>
            </div>
          </div>

          {/* 5. Order Processing & Shipping */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Order Processing &amp; Shipping</h2>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Order Confirmation:</strong> Once you place an order, you will receive a confirmation email. This email serves as an acknowledgment that we have received your order, but it does not guarantee acceptance. We reserve the right to cancel or refuse any order.
              </p>
              <p>
                <strong className="font-bold text-black">Shipping:</strong> We aim to process and ship orders promptly. However, delivery times are estimates and may vary due to factors beyond our control. Eligoleather is not responsible for any delays caused by shipping carriers or customs processes.
              </p>
              <p>
                <strong className="font-bold text-black">International Shipping:</strong> For international orders, you are responsible for paying any import duties, taxes, or customs fees applicable in your country.
              </p>
            </div>
          </div>

          {/* 6. Returns & Refunds */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Returns &amp; Refunds</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              For information on returns and refunds, please refer to our{" "}
              <Link href="/refund-policy" className="font-bold text-amber-800 hover:underline">
                Refund Policy
              </Link>
              , which is incorporated into these Terms of Service by reference.
            </p>
          </div>

          {/* 7. Intellectual Property */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Intellectual Property</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              All content on this website, including but not limited to text, images, graphics, logos, and product descriptions, is the property of Eligoleather or our content suppliers and is protected by intellectual property laws.
            </p>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              You may not reproduce, distribute, or use any content from this website without our prior written consent.
            </p>
          </div>

          {/* 8. User-Generated Content */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">User-Generated Content</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              You may have the opportunity to submit reviews, comments, or other content on our website or social media channels. By submitting content, you agree to the following terms:
            </p>

            <ul className="list-disc list-inside space-y-2 text-lg text-gray-800 pl-2">
              <li>You grant Eligoleather a non-exclusive, royalty-free, perpetual, and transferable license to use, modify, distribute, or display your content.</li>
              <li>You represent that the content you submit is your original work, does not violate any laws or rights of third parties, and is free of inappropriate, offensive, or harmful material.</li>
              <li>We reserve the right to remove or modify user-generated content at our discretion.</li>
            </ul>
          </div>

          {/* 9. Privacy */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Privacy</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Your use of our website is also governed by our{" "}
              <Link href="/privacy-policy" className="font-bold text-amber-800 hover:underline">
                Privacy Policy
              </Link>
              , which explains how we collect, use, and protect your personal information.
            </p>
          </div>

          {/* 10. Prohibited Conduct */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Prohibited Conduct</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              When using our website, you agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>Use the site for any unlawful purpose or to solicit others to engage in unlawful activities.</li>
              <li>Violate any international, federal, or local laws, regulations, or ordinances.</li>
              <li>Interfere with or disrupt the security or functionality of the website.</li>
              <li>Submit false or misleading information.</li>
              <li>Transmit viruses, malware, or harmful code that may damage or affect the website.</li>
            </ul>
          </div>

          {/* 11. Limitation of Liability */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Limitation of Liability</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Eligoleather is not liable for any direct, indirect, incidental, or consequential damages arising from your use of our website or products, including but not limited to lost profits, data loss, or personal injury.
            </p>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We are not responsible for any damages resulting from the improper use of our products or any failure to follow care instructions.
            </p>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              In no case shall Eligoleather, its directors, officers, employees, or affiliates be liable for any claim, including but not limited to negligence or breach of contract, that exceeds the amount paid by you for the products purchased.
            </p>
          </div>

          {/* 12. Disclaimer of Warranties */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Disclaimer of Warranties</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              All products and services provided through <strong className="font-bold text-black">Eligoleather.com</strong> are provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee that the products or services will meet your expectations or that any defects will be corrected. To the fullest extent permitted by law, we disclaim any warranties, whether express or implied, including but not limited to warranties of merchantability and fitness for a particular purpose.
            </p>
          </div>

          {/* 13. Indemnification */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Indemnification</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              You agree to indemnify, defend, and hold harmless <strong className="font-bold text-black">Eligoleather</strong>, its directors, officers, employees, and affiliates from any claims, demands, liabilities, damages, or expenses (including attorney’s fees) arising from your breach of these Terms of Service or your violation of any law or rights of a third party.
            </p>
          </div>

          {/* 14. Termination */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Termination</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We reserve the right to terminate your access to our website or services at any time, without notice, if you violate these Terms of Service or engage in prohibited conduct. Upon termination, your right to use the website and any services will immediately cease.
            </p>
          </div>

          {/* 15. Governing Law */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Governing Law</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              These Terms of Service shall be governed by and construed in accordance with the laws of <strong className="font-bold text-black">Pakistan</strong>, without regard to its conflict of law principles. Any legal action or proceeding arising out of or relating to these terms shall be brought exclusively in the courts of Islamabad, Pakistan.
            </p>
          </div>

          {/* 16. Changes to the Terms of Service */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Changes to the Terms of Service</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We reserve the right to update or modify these Terms of Service at any time without prior notice. Your continued use of the website following any changes constitutes your acceptance of the revised terms.
            </p>
          </div>

          {/* 17. Contact Us */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Contact Us</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              If you have any questions or concerns about these Terms of Service, please contact us at:
            </p>

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <h3 className="text-xl font-bold text-black">Eligoleather Customer Support</h3>
              <p className="text-lg text-gray-800">
                Email: <a href="mailto:support@eligoleather.com" className="text-amber-800 font-semibold hover:underline">support@eligoleather.com</a>
              </p>
              <p className="text-lg text-gray-800">
                Phone: <a href="tel:0512745781" className="text-amber-800 font-semibold hover:underline">051-2745781</a>
              </p>
              <p className="text-lg text-gray-800">
                Address: <span className="font-semibold">Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive Block, Gulberg Greens, Islamabad, Pakistan.</span>
              </p>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</div>
  )
}
