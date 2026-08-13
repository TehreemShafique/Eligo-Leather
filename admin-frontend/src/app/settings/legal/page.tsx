"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  FileText,
  Cookie,
  Sparkle,
  Check,
  ArrowSquareOut,
  PencilSimple,
  ArrowClockwise,
} from "@phosphor-icons/react"
import { toast } from "sonner"

export default function AdminSettingsLegalPage() {
  const [activePolicyTab, setActivePolicyTab] = useState<
    "privacy_policy" | "refund_policy" | "terms_of_service" | "shipping_policy" | "legal_notice"
  >("privacy_policy")

  // Policy Form Contents
  const [policies, setPolicies] = useState({
    privacy_policy: {
      title: "Privacy Policy",
      isAutomated: true,
      content:
        "<h2>Privacy Policy for Eligo Leather</h2><p>This Privacy Policy describes how Eligo Leather collects, uses, and discloses your Personal Information when you visit or make a purchase from eligoleather.com.</p><h3>Collecting Personal Information</h3><p>When you visit the Site, we collect certain information about your device, your interaction with the Site, and information necessary to process your purchases.</p>",
    },
    refund_policy: {
      title: "Refund & Return Policy",
      isAutomated: true,
      content:
        "<h2>Refund & Return Policy</h2><p>We have a 30-day return policy, which means you have 30 days after receiving your handcrafted leather item to request a return or exchange.</p><h3>Eligibility for Returns</h3><p>To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging.</p>",
    },
    terms_of_service: {
      title: "Terms of Service",
      isAutomated: true,
      content:
        "<h2>Terms of Service</h2><p>This website is operated by Eligo Leather Goods. Throughout the site, the terms 'we', 'us' and 'our' refer to Eligo Leather.</p><h3>Store Terms</h3><p>By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence.</p>",
    },
    shipping_policy: {
      title: "Shipping & Delivery Policy",
      isAutomated: true,
      content:
        "<h2>Shipping & Delivery Policy</h2><p>All orders placed at Eligo Leather are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.</p><h3>Domestic Shipping Rates (Pakistan)</h3><p>Standard delivery across Pakistan is charged at a flat rate of Rs 250. Orders exceeding Rs 2,000 qualify for FREE shipping automatically.</p>",
    },
    legal_notice: {
      title: "Legal Notice & Impressum",
      isAutomated: false,
      content:
        "<h2>Legal Notice / Merchant Information</h2><p><strong>Merchant Name:</strong> Eligo Leather Goods</p><p><strong>Registered Address:</strong> Off # 407, 4th floor, Gulberg Empire, Executive Block, Gulberg Greens, Islamabad, Pakistan</p><p><strong>Contact Email:</strong> eligoleather9@gmail.com</p><p><strong>Phone:</strong> 0334-5399470</p>",
    },
  })

  const currentPolicy = policies[activePolicyTab]

  const handleUpdateContent = (newHtml: string) => {
    setPolicies({
      ...policies,
      [activePolicyTab]: {
        ...currentPolicy,
        content: newHtml,
        isAutomated: false,
      },
    })
  }

  const handleInsertSystemTemplate = () => {
    const templates: Record<string, string> = {
      privacy_policy:
        "<h2>Standard E-Commerce Privacy Policy</h2><p>We take your privacy seriously. All customer payment data and personal address details are processed securely and encrypted via SSL.</p>",
      refund_policy:
        "<h2>Standard 30-Day Refund Policy</h2><p>If you are not 100% satisfied with your leather belt or wallet purchase, return it within 30 days for a full refund or store credit.</p>",
      terms_of_service:
        "<h2>Standard Terms of Service</h2><p>By using eligoleather.com, you agree to comply with all terms and conditions governing online transactions.</p>",
      shipping_policy:
        "<h2>Standard Shipping Policy</h2><p>Domestic orders are delivered within 2-4 business days via Leopards Courier or Sonic-Trax.</p>",
      legal_notice:
        "<h2>Standard Legal Notice</h2><p>Eligo Leather Goods &bull; Islamabad, Pakistan.</p>",
    }

    setPolicies({
      ...policies,
      [activePolicyTab]: {
        ...currentPolicy,
        content: templates[activePolicyTab] || currentPolicy.content,
        isAutomated: true,
      },
    })

    toast.success(`Inserted automated system template for ${currentPolicy.title}!`)
  }

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Saved disclosures for ${currentPolicy.title}! Storefront legal footer links updated.`)
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header & Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
            <span>Shopify Unified Legal &amp; Privacy Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Legal Disclosures &amp; Policies
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage legal disclosures (Privacy, Refund, Terms, Shipping, Legal Notice). Content is rendered dynamically on storefront footer pages.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-6 text-xs font-bold">
          <Link
            href="/settings/privacy"
            className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <Cookie className="w-4 h-4" />
            <span>Customer Privacy &amp; Cookie Consent</span>
          </Link>

          <button
            className="pb-3 transition-colors border-b-2 border-amber-800 text-amber-800 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Legal Disclosures &amp; Policies</span>
          </button>
        </div>
      </div>

      {/* Policy Selector Sub-Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {[
          { key: "privacy_policy", label: "Privacy Policy" },
          { key: "refund_policy", label: "Refund Policy" },
          { key: "terms_of_service", label: "Terms of Service" },
          { key: "shipping_policy", label: "Shipping Policy" },
          { key: "legal_notice", label: "Legal Notice" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActivePolicyTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl border transition-colors cursor-pointer ${
              activePolicyTab === tab.key
                ? "bg-amber-800 text-white border-amber-800 shadow-2xs"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Policy Editor Card */}
      <form onSubmit={handleSavePolicies} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{currentPolicy.title}</h2>
            <span className="text-[11px] text-gray-500">
              Status: {currentPolicy.isAutomated ? "Using Automated Template" : "Custom Merchant Content"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleInsertSystemTemplate}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowClockwise className="w-3.5 h-3.5 text-amber-800" />
            <span>Insert System Template</span>
          </button>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 uppercase tracking-wide mb-1">Policy Content (HTML / Rich Text)</label>
          <textarea
            rows={12}
            value={currentPolicy.content}
            onChange={(e) => handleUpdateContent(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-300 font-mono text-xs text-gray-900 focus:outline-hidden"
          />
        </div>

        {/* Live Storefront HTML Preview */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
          <span className="font-bold text-gray-900 text-xs uppercase tracking-wide block">Storefront Live Preview</span>
          <div
            className="prose prose-sm max-w-none text-gray-800 bg-white p-4 rounded-lg border border-gray-200 shadow-2xs"
            dangerouslySetInnerHTML={{ __html: currentPolicy.content }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save {currentPolicy.title}
          </button>
        </div>
      </form>
    </div>
  )
}
