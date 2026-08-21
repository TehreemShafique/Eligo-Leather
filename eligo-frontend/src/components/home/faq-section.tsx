import Image from "next/image"

export interface FAQItem {
  question: string
  answer: string
  icon: string
}

const FAQS: FAQItem[] = [
  {
    question: "What types of leather do you use in your products?",
    answer:
      "We exclusively use 100% genuine full-grain and top-grain cowhide leathers sourced responsibly. Our leather is carefully tanned to ensure luxury feel, natural patina over time, and maximum durability.",
    icon: "/images/homepage/17_rectangle_1699.webp",
  },
  {
    question: "Do you provide warranty on leather items?",
    answer:
      "Yes! All Eligo Leather products come with a 1-year warranty covering manufacturing defects, stitching, and hardware integrity.",
    icon: "/images/homepage/18_rectangle_1699.webp",
  },
  {
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 7-day hassle-free exchange and return policy. If you are not completely satisfied with your order, contact our support team for an immediate replacement or refund.",
    icon: "/images/homepage/19_rectangle_1699.webp",
  },
  {
    question: "How long does delivery take across Pakistan?",
    answer:
      "Orders are processed within 24 hours. Standard courier delivery takes 2 to 4 working days to major cities like Karachi, Lahore, Islamabad, and Rawalpindi.",
    icon: "/images/homepage/20_rectangle_1699.webp",
  },
  {
    question: "How should I care for my leather product?",
    answer:
      "Keep your leather products away from excess moisture and direct prolonged sunlight. Clean with a damp cloth and apply leather conditioner every 3 to 6 months for best shine and softness.",
    icon: "/images/homepage/21_rectangle_1699.webp",
  },
  {
    question: "Are your wallets equipped with RFID protection?",
    answer:
      "Yes, our wallets and card holders feature built-in RFID blocking technology to protect your credit cards and personal data from unauthorized digital scanning.",
    icon: "/images/homepage/22_rectangle_1699.webp",
  },
]

export const PRODUCT_FAQS: FAQItem[] = [
  {
    question: "How do I choose the right leather product?",
    answer: "Check the product dimensions, material, compartments, and intended use shown on each product page. These details will help you compare wallets, belts, cases, and accessories before ordering.",
    icon: "/images/homepage/17_rectangle_1699.webp",
  },
  {
    question: "Are Eligo Leather products made from genuine leather?",
    answer: "Our product descriptions clearly identify the leather and materials used for each item. Review the material details on the product page for the exact construction of the item you are considering.",
    icon: "/images/homepage/18_rectangle_1699.webp",
  },
  {
    question: "Can I see more images before buying?",
    answer: "Yes. Open a product to view its available gallery images, close-up details, colors, and product information before adding it to your cart.",
    icon: "/images/homepage/19_rectangle_1699.webp",
  },
  {
    question: "How long does product delivery take?",
    answer: "Orders are normally processed within 24 hours, with standard delivery taking approximately 2 to 4 working days across major cities in Pakistan.",
    icon: "/images/homepage/20_rectangle_1699.webp",
  },
  {
    question: "Can I return or exchange a product?",
    answer: "Eligible unused products can be returned or exchanged according to our return and refund policy. Keep the original packaging and contact support within the stated return period.",
    icon: "/images/homepage/21_rectangle_1699.webp",
  },
  {
    question: "How should I care for my leather purchase?",
    answer: "Keep leather away from excess moisture and prolonged sunlight, wipe it gently with a soft cloth, and use a suitable leather conditioner periodically.",
    icon: "/images/homepage/22_rectangle_1699.webp",
  },
]

export function createCategoryFaqs(categoryName: string): FAQItem[] {
  const name = categoryName.replace(/^All\s+/i, "").replace(/\s+Category$/i, "")

  return [
    {
      question: `What products are included in the ${name} collection?`,
      answer: `The ${name} collection contains the currently available designs shown on this page. Use the sorting and product-view controls to compare their styles, prices, and features.`,
      icon: "/images/homepage/17_rectangle_1699.webp",
    },
    {
      question: `How do I choose the right ${name} item?`,
      answer: "Compare the size, leather type, compartments, color, and intended use listed on each product page to find the option that best fits your needs.",
      icon: "/images/homepage/18_rectangle_1699.webp",
    },
    {
      question: `Are all ${name} products currently in stock?`,
      answer: "Availability is shown on each product page and may change as items are sold or restocked. Add an available item to your cart to continue with your order.",
      icon: "/images/homepage/19_rectangle_1699.webp",
    },
    {
      question: `Can I order ${name} products anywhere in Pakistan?`,
      answer: "Yes. We deliver across Pakistan, with standard delivery generally taking approximately 2 to 4 working days after order processing.",
      icon: "/images/homepage/20_rectangle_1699.webp",
    },
    {
      question: `Can ${name} products be returned or exchanged?`,
      answer: "Eligible unused items can be returned or exchanged under our return and refund policy. Please retain the original packaging and contact support within the stated period.",
      icon: "/images/homepage/21_rectangle_1699.webp",
    },
    {
      question: `How should I care for products in this category?`,
      answer: "Store leather items in a dry place, avoid prolonged sunlight and excess moisture, clean them with a soft cloth, and condition the leather when needed.",
      icon: "/images/homepage/22_rectangle_1699.webp",
    },
  ]
}
function FaqItem({ faq }: { faq: FAQItem }) {
  return (
    <details className="group overflow-hidden rounded-[10px] border border-amber-800 bg-white lg:min-h-[3.333333cqw] lg:rounded-[0.520833cqw]">
      <summary className="relative flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden lg:h-[3.333333cqw] lg:min-h-0 lg:p-0">
        <span className="pr-2 text-lg font-bold leading-7 text-black sm:text-xl sm:leading-8 lg:absolute lg:left-[1.5625cqw] lg:top-[1.041667cqw] lg:pr-0 lg:text-[1.041667cqw] lg:leading-[1.666667cqw]">
          {faq.question}
        </span>

        <span className="relative h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180 lg:absolute lg:left-[40.104167cqw] lg:top-[1.302083cqw] lg:h-[1.041667cqw] lg:w-[1.041667cqw]">
          <Image
            src={faq.icon}
            alt=""
            fill
            sizes="20px"
            className="object-contain"
          />
        </span>
      </summary>

      <div className="border-t border-amber-800/20 px-6 pb-5 pt-4 text-base font-normal leading-relaxed text-gray-700 lg:px-[1.5625cqw] lg:pb-[1.041667cqw] lg:pt-[0.833333cqw] lg:text-[0.833333cqw]">
        {faq.answer}
      </div>
    </details>
  )
}

export interface FaqSectionProps {
  title?: string
  items?: FAQItem[]
}

export function FaqSection({
  title = "Frequently Asked Questions",
  items = FAQS,
}: FaqSectionProps = {}) {
  const midpoint = Math.ceil(items.length / 2)
  const columns = [items.slice(0, midpoint), items.slice(midpoint)]

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
  return (
    <section className="w-full bg-slate-50 font-['Manrope']">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto w-full max-w-[1920px] [container-type:inline-size]">
        <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[27.083333cqw] lg:px-0 lg:pb-[1.875cqw] lg:pt-[10.416667cqw]">
          <h2 className="mb-10 text-center text-3xl font-bold leading-tight text-black sm:text-4xl lg:absolute lg:left-[33.697917cqw] lg:top-[4.6875cqw] lg:mb-0 lg:text-left lg:text-[2.5cqw] lg:leading-[3.645833cqw]">
            {title}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:ml-[6.25cqw] lg:w-[87.5cqw] lg:grid-cols-[42.708333cqw_42.708333cqw] lg:gap-[2.083333cqw]">
            {columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex flex-col gap-4 lg:gap-[2.395833cqw]"
              >
                {column.map((faq) => (
                  <FaqItem key={faq.question} faq={faq} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}