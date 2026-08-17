"use client"

import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export function PrivacyPolicyContent() {
  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
        </div>

        {/* Title Header */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-800 tracking-tight">
            Privacy Policy
          </h1>
        </div>

        {/* Intro Box */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs mb-12 text-lg text-black font-normal leading-relaxed">
          At Eligoleather, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and protect the data you provide when using our website,{" "}
          <strong className="font-bold text-amber-800">Eligoleather.com</strong>, and our services. By accessing and using our website, you agree to the terms of this Privacy Policy.
        </div>

        {/* Policy Sections */}
        <div className="space-y-12 text-black font-['Manrope']">
          {/* Section 1: Information We Collect */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Information We Collect</h2>

            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We collect personal information that you provide directly to us when you:
            </p>

            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>Make a purchase on our website</li>
              <li>Create an account</li>
              <li>Subscribe to our newsletter or promotional offers</li>
              <li>Contact our customer service team</li>
              <li>Engage with us on social media platforms</li>
            </ul>

            <p className="text-lg font-normal leading-relaxed text-gray-800 pt-2">
              The personal information we may collect includes, but is not limited to:
            </p>

            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>Name</li>
              <li>Shipping and billing address</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Payment information (credit card details or other payment methods)</li>
              <li>Purchase history</li>
              <li>IP address and browsing behavior (collected automatically)</li>
            </ul>
          </div>

          {/* Section 2: How We Use Your Information */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">How We Use Your Information</h2>

            <p className="text-lg font-normal leading-relaxed text-gray-800">
              The information we collect is used to provide, maintain, and improve our services, including:
            </p>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Order Processing:</strong> To process and fulfill your orders, send order confirmations, and provide shipping updates.
              </p>
              <p>
                <strong className="font-bold text-black">Customer Support:</strong> To respond to your inquiries, offer assistance, and resolve any issues.
              </p>
              <p>
                <strong className="font-bold text-black">Marketing &amp; Communication:</strong> To send you promotional emails, newsletters, or special offers if you have opted into these communications. You can opt out of marketing communications at any time.
              </p>
              <p>
                <strong className="font-bold text-black">Improving User Experience:</strong> To analyze customer behavior and trends on our website, allowing us to enhance your shopping experience.
              </p>
            </div>
          </div>

          {/* Section 3: How We Protect Your Information */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">How We Protect Your Information</h2>

            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We take data protection and privacy seriously. To safeguard your personal information, we use the following security measures:
            </p>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Encryption:</strong> We use industry-standard SSL (Secure Socket Layer) encryption to protect your sensitive information during transactions.
              </p>
              <p>
                <strong className="font-bold text-black">Secure Payment Processing:</strong> We do not store your payment information on our servers. All payment transactions are securely processed through trusted third-party payment processors.
              </p>
              <p>
                <strong className="font-bold text-black">Restricted Access:</strong> Only authorized personnel have access to your personal information, and we take steps to ensure that your data is handled securely.
              </p>
            </div>
          </div>

          {/* Section 4: Sharing Your Information */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Sharing Your Information</h2>

            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Eligoleather does not sell, trade, or rent your personal information to third parties. However, we may share your information with:
            </p>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Service Providers:</strong> Trusted third-party companies that assist in operating our website, conducting our business, or servicing you (e.g., payment processors, shipping carriers). These providers only have access to the information necessary to perform their tasks and are required to keep your information confidential.
              </p>
              <p>
                <strong className="font-bold text-black">Legal Obligations:</strong> We may disclose your information if required by law, such as to comply with legal obligations, protect our rights, or respond to lawful government requests.
              </p>
            </div>
          </div>

          {/* Section 5: Your Rights */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Your Rights</h2>

            <p className="text-lg font-normal leading-relaxed text-gray-800">
              You have the following rights regarding your personal information:
            </p>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Access &amp; Correction:</strong> You may request access to the personal information we hold about you and ask us to update, correct, or delete it.
              </p>
              <p>
                <strong className="font-bold text-black">Data Portability:</strong> You have the right to request a copy of your data in a structured, machine-readable format.
              </p>
              <p>
                <strong className="font-bold text-black">Withdraw Consent:</strong> If you have given us consent to process your data for marketing purposes, you can withdraw that consent at any time.
              </p>
              <p>
                <strong className="font-bold text-black">Opt-Out:</strong> You may opt-out of receiving marketing emails by following the unsubscribe instructions in our emails or by contacting us directly.
              </p>
            </div>
          </div>

          {/* Section 6: Cookies & Tracking Technologies */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Cookies &amp; Tracking Technologies</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Eligoleather uses cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. Cookies are small text files stored on your device when you visit our website.
            </p>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              You may choose to disable cookies through your browser settings, but please note that doing so may limit your access to certain features of our website.
            </p>
          </div>

          {/* Section 7: Third-Party Links */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Third-Party Links</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Our website may contain links to third-party websites. Please note that this Privacy Policy does not apply to those websites, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </div>

          {/* Section 8: Children's Privacy */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Children&apos;s Privacy</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Eligoleather does not knowingly collect personal information from children under the age of 13. If we become aware that we have inadvertently collected such information, we will take steps to delete it promptly.
            </p>
          </div>

          {/* Section 9: Changes to This Privacy Policy */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Changes to This Privacy Policy</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page, and we encourage you to review this policy periodically. Your continued use of our website after any modifications constitutes your acceptance of the updated Privacy Policy.
            </p>
          </div>

          {/* Section 10: Contact Us */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Contact Us</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at:
            </p>

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <h3 className="text-xl font-bold text-black">Eligoleather Customer Support</h3>
              <p className="text-lg text-gray-800">Email: <a href="mailto:support@eligoleather.com" className="text-amber-800 font-semibold hover:underline">support@eligoleather.com</a></p>
              <p className="text-lg text-gray-800">Phone: <a href="tel:0512745781" className="text-amber-800 font-semibold hover:underline">051-2745781</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
