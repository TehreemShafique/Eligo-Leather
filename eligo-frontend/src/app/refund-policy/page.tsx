import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({ title: "Refund and Return Policy", description: "Review Eligo Leather return, exchange and refund conditions, eligibility requirements, return shipping responsibilities and processing timelines.", path: "/refund-policy", keywords: ["Eligo Leather refund policy", "leather product returns"] })

export default function RefundPolicyPage() {
  return (
    <div className="relative left-1/2 w-[min(1920px,100vw)] -translate-x-1/2 bg-slate-50 font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] space-y-10 px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:px-8 min-[1800px]:h-[2625px] min-[1800px]:overflow-hidden min-[1800px]:space-y-0 min-[1800px]:p-0">
        <PageBreadcrumb label="Refund Policy" />

        <h1 className="text-5xl font-bold leading-tight text-amber-800 sm:text-6xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[76px] min-[1800px]:leading-[70px]">
          Refund Policy
        </h1>

        <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[186px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
          At Eligoleather, we pride ourselves on providing high-quality leather
          goods and exceptional customer service. If for any reason you are not
          completely satisfied with your purchase, we offer a hassle-free refund
          and return process. Please review our Refund Policy below to ensure a
          smooth experience.
        </p>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[276px]">
            Returns
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[352px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We accept returns for eligible items within{" "}
            <strong className="font-bold">30 days</strong> of your purchase. To
            qualify for a return, the following conditions must be met:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[402px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>
              The item must be unused, unworn, and in the same condition that you
              received it.
            </li>
            <li>
              The item must be in its original packaging, including tags and any
              accompanying materials.
            </li>
            <li>
              Proof of purchase (order confirmation or receipt) is required for
              all returns.
            </li>
          </ul>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[503px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            <strong className="font-bold">Non-returnable items</strong> include:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[553px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>Gift cards</li>
            <li>
              Customized or personalized items (e.g., engraved wallets or belts)
            </li>
          </ul>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[637px]">
            How to Initiate a Return
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[713px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            To initiate a return, please follow these steps:
          </p>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[763px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Contact Us: </strong>
              Email us at{" "}
              <a
                href="mailto:returns@eligoleather.com"
                className="font-bold text-black hover:underline"
              >
                returns@eligoleather.com
              </a>{" "}
              with your order number and reason for the return.
            </p>
            <p>
              <strong className="font-bold">Return Authorization:</strong> Once
              your return request is approved, we will provide you with a return
              authorization and instructions on where to send the item.
            </p>
            <p>
              <strong className="font-bold">Ship the Item:</strong> Carefully
              package the item and send it back to the address provided. You are
              responsible for covering the shipping costs for returning your item
              unless the product was defective or the return is due to an error
              on our part.
            </p>
          </div>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[891px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We recommend using a trackable shipping method to ensure the safe
            return of your item, as we cannot guarantee receipt of your returned
            package without tracking information.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[981px]">
            Refunds
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1057px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Once we receive and inspect your returned item, we will notify you via
            email of the status of your refund. If your return is approved, a
            refund will be processed to your original payment method within{" "}
            <strong className="font-bold">5-7 business days.</strong>
          </p>

          <h3 className="text-2xl font-bold leading-9 min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1137px] min-[1800px]:w-[560px]">
            Please note:
          </h3>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1193px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            <li>
              Refunds may take some time to appear in your account, depending on
              your bank or credit card provider.
            </li>
            <li>
              Shipping costs are non-refundable. If you receive a refund, the
              original cost of shipping will be deducted unless the return is due
              to our error (e.g., defective or incorrect item).
            </li>
          </ul>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1277px]">
            Exchanges
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1353px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We only replace items if they are defective, damaged, or if you need
            a different size or variation. If you need to exchange an item,
            please contact us
            <br />
            <br />
            at{" "}
            <a
              href="mailto:exchanges@eligoleather.com"
              className="font-bold text-black hover:underline"
            >
              exchanges@eligoleather.com
            </a>{" "}
            and follow the same steps outlined in the return process.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1473px]">
            Late or Missing Refunds
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1549px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            If you haven&apos;t received your refund after 7 business days, please
            follow these steps:
          </p>

          <div className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1599px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Check your bank account or credit card statement.
            <br />
            Contact your bank or credit card provider as processing times may
            vary.
            <br />
            If you&apos;ve done the above and still haven&apos;t received your refund,
            please contact us at{" "}
            <a
              href="mailto:support@eligoleather.com"
              className="font-bold text-black hover:underline"
            >
              support@eligoleather.com.
            </a>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1710px]">
            Return Shipping Costs
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1786px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            You will be responsible for paying for your own shipping costs for
            returning your item, except in the following cases:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1836px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            <li>The product arrived damaged or defective.</li>
            <li>You received the wrong item due to our error.</li>
          </ul>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1910px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            For returns involving product defects or incorrect items, we will
            cover the return shipping cost and ensure you receive a replacement
            or full refund.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1970px]">
            Final Sale Items
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2046px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Items marked as <strong className="font-bold">Final Sale </strong>
            are not eligible for returns or refunds unless they arrive damaged
            or defective.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2106px]">
            Cancellations
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2182px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            If you need to cancel your order, please contact us as soon as
            possible at{" "}
            <a
              href="mailto:support@eligoleather.com"
              className="font-bold text-black hover:underline"
            >
              support@eligoleather.com
            </a>
            . Orders that have not yet been shipped can be canceled for a full
            refund. Once an order has been shipped, the cancellation policy no
            longer applies, and you will need to follow the return process.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2272px]">
            Contact Us
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2348px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            If you have any questions regarding our Refund Policy or need
            assistance with your return or exchange, please reach out to our
            support team:
          </p>

          <h3 className="text-2xl font-bold leading-9 min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2408px] min-[1800px]:w-[560px]">
            Eligoleather Customer Support
          </h3>

          <address className="text-lg font-normal not-italic leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2464px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            Email:{" "}
            <a
              href="mailto:support@eligoleather.com"
              className="font-bold text-black hover:underline"
            >
              support@eligoleather.com
            </a>
            <br />
            Phone:{" "}
            <a
              href="tel:0512745781"
              className="font-bold text-black hover:underline"
            >
              051-2745781
            </a>
            <br />
            Address:{" "}
            <strong className="font-bold">
              Office # 407, 4th floor, Gulberg Empire, Civic Center, Executive
              Block, Gulberg Greens, Islamabad, Pakistan.
            </strong>
          </address>
        </section>
      </div>
    </div>
  )
}
