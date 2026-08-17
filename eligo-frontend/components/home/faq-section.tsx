"use client"

import { useState } from "react"
import { CaretDown } from "@phosphor-icons/react"

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    question: "What types of leather do you use in your products?",
    answer:
      "We exclusively use 100% genuine full-grain and top-grain cowhide leathers sourced responsibly. Our leather is carefully tanned to ensure luxury feel, natural patina over time, and maximum durability.",
  },
  {
    question: "Do you provide warranty on leather items?",
    answer:
      "Yes! All Eligo Leather products come with a 1-year warranty covering manufacturing defects, stitching, and hardware integrity.",
  },
  {
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 7-day hassle-free exchange and return policy. If you are not completely satisfied with your order, contact our support team for an immediate replacement or refund.",
  },
  {
    question: "How long does delivery take across Pakistan?",
    answer:
      "Orders are processed within 24 hours. Standard courier delivery takes 2 to 4 working days to major cities like Karachi, Lahore, Islamabad, and Rawalpindi.",
  },
  {
    question: "How should I care for my leather product?",
    answer:
      "Keep your leather products away from excess moisture and direct prolonged sunlight. Clean with a damp cloth and apply leather conditioner every 3 to 6 months for best shine and softness.",
  },
  {
    question: "Are your wallets equipped with RFID protection?",
    answer:
      "Yes, our wallets and card holders feature built-in RFID blocking technology to protect your credit cards and personal data from unauthorized digital scanning.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-black font-['Manrope'] tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* 2-Column Accordion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="bg-white rounded-[10px] border border-amber-800 transition-all overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-hidden"
                >
                  <span className="text-lg sm:text-xl font-bold text-black font-['Manrope'] leading-snug pr-4">
                    {faq.question}
                  </span>
                  <CaretDown
                    className={`w-5 h-5 text-amber-800 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-gray-700 text-base font-normal font-['Manrope'] border-t border-amber-800/20 leading-relaxed animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
