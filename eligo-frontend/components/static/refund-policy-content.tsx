"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export function RefundPolicyContent() {
  const [dbPolicyHtml, setDbPolicyHtml] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    fetch("http://127.0.0.1:8000/api/v1/settings/legal-privacy/policies")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          const found = data.find((p: any) => p.policy_type === "refund_policy")
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
          <Breadcrumbs items={[{ label: "Refund Policy" }]} />
        </div>

        {/* Title Header */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-800 tracking-tight">
            Refund Policy
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
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs mb-12 text-lg text-black font-normal leading-relaxed">
              At Eligoleather, we pride ourselves on providing high-quality leather goods and exceptional customer service. If for any reason you are not completely satisfied with your purchase, we offer a hassle-free refund and return process. Please review our Refund Policy below to ensure a smooth experience.
            </div>

        {/* Policy Sections */}
        <div className="space-y-12">
          {/* 1. Returns */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Returns</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We accept returns for eligible items within <strong className="font-bold text-black">30 days</strong> of your purchase. To qualify for a return, the following conditions must be met:
            </p>
            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>The item must be unused, unworn, and in the same condition that you received it.</li>
              <li>The item must be in its original packaging, including tags and any accompanying materials.</li>
              <li>Proof of purchase (order confirmation or receipt) is required for all returns.</li>
            </ul>

            <p className="text-lg font-bold text-black pt-2">Non-returnable items include:</p>
            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>Gift cards</li>
              <li>Customized or personalized items (e.g., engraved wallets or belts)</li>
            </ul>
          </div>

          {/* 2. How to Initiate a Return */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">How to Initiate a Return</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              To initiate a return, please follow these steps:
            </p>

            <div className="space-y-3 text-lg text-gray-800">
              <p>
                <strong className="font-bold text-black">Contact Us:</strong> Email us at{" "}
                <a href="mailto:returns@eligoleather.com" className="font-bold text-amber-800 hover:underline">
                  returns@eligoleather.com
                </a>{" "}
                with your order number and reason for the return.
              </p>
              <p>
                <strong className="font-bold text-black">Return Authorization:</strong> Once your return request is approved, we will provide you with a return authorization and instructions on where to send the item.
              </p>
              <p>
                <strong className="font-bold text-black">Ship the Item:</strong> Carefully package the item and send it back to the address provided. You are responsible for covering the shipping costs for returning your item unless the product was defective or the return is due to an error on our part.
              </p>
            </div>

            <p className="text-lg font-normal text-gray-700 pt-2 border-t border-gray-100">
              We recommend using a trackable shipping method to ensure the safe return of your item, as we cannot guarantee receipt of your returned package without tracking information.
            </p>
          </div>

          {/* 3. Refunds */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Refunds</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Once we receive and inspect your returned item, we will notify you via email of the status of your refund. If your return is approved, a refund will be processed to your original payment method within <strong className="font-bold text-black">5-7 business days</strong>.
            </p>

            <h3 className="text-2xl font-bold text-black pt-2">Please note:</h3>
            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>Refunds may take some time to appear in your account, depending on your bank or credit card provider.</li>
              <li>Shipping costs are non-refundable. If you receive a refund, the original cost of shipping will be deducted unless the return is due to our error (e.g., defective or incorrect item).</li>
            </ul>
          </div>

          {/* 4. Exchanges */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Exchanges</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              We only replace items if they are defective, damaged, or if you need a different size or variation. If you need to exchange an item, please contact us at{" "}
              <a href="mailto:exchanges@eligoleather.com" className="font-bold text-amber-800 hover:underline">
                exchanges@eligoleather.com
              </a>{" "}
              and follow the same steps outlined in the return process.
            </p>
          </div>

          {/* 5. Late or Missing Refunds */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Late or Missing Refunds</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              If you haven’t received your refund after 7 business days, please follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>Check your bank account or credit card statement.</li>
              <li>Contact your bank or credit card provider as processing times may vary.</li>
              <li>
                If you’ve done the above and still haven’t received your refund, please contact us at{" "}
                <a href="mailto:support@eligoleather.com" className="font-bold text-amber-800 hover:underline">
                  support@eligoleather.com
                </a>
                .
              </li>
            </ol>
          </div>

          {/* 6. Return Shipping Costs */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Return Shipping Costs</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              You will be responsible for paying for your own shipping costs for returning your item, except in the following cases:
            </p>
            <ul className="list-disc list-inside space-y-1 text-lg text-gray-800 pl-2">
              <li>The product arrived damaged or defective.</li>
              <li>You received the wrong item due to our error.</li>
            </ul>
            <p className="text-lg font-normal leading-relaxed text-gray-800 pt-2">
              For returns involving product defects or incorrect items, we will cover the return shipping cost and ensure you receive a replacement or full refund.
            </p>
          </div>

          {/* 7. Final Sale Items */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Final Sale Items</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              Items marked as <strong className="font-bold text-black">Final Sale</strong> are not eligible for returns or refunds unless they arrive damaged or defective.
            </p>
          </div>

          {/* 8. Cancellations */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Cancellations</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              If you need to cancel your order, please contact us as soon as possible at{" "}
              <a href="mailto:support@eligoleather.com" className="font-bold text-amber-800 hover:underline">
                support@eligoleather.com
              </a>
              . Orders that have not yet been shipped can be canceled for a full refund. Once an order has been shipped, the cancellation policy no longer applies, and you will need to follow the return process.
            </p>
          </div>

          {/* 9. Contact Us */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Contact Us</h2>
            <p className="text-lg font-normal leading-relaxed text-gray-800">
              If you have any questions regarding our Refund Policy or need assistance with your return or exchange, please reach out to our support team:
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
