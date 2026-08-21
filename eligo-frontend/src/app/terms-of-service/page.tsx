import Link from "next/link"
import { buildSeoMetadata } from "@/lib/seo"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export const metadata = buildSeoMetadata({ title: "Terms of Service", description: "Read the terms governing use of the Eligo Leather website, customer accounts, product orders, payments, delivery, intellectual property and liability.", path: "/terms-of-service", keywords: ["Eligo Leather terms", "online store terms Pakistan"] })

export default function TermsOfServicePage() {
  return (
    <div className="relative left-1/2 w-[min(1920px,100vw)] -translate-x-1/2 bg-slate-50 font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] space-y-10 px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:px-8 min-[1800px]:h-[4022px] min-[1800px]:overflow-hidden min-[1800px]:space-y-0 min-[1800px]:p-0">
        <PageBreadcrumb label="Terms of Service" />

        <h1 className="text-5xl font-bold leading-tight text-amber-800 sm:text-6xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[76px] min-[1800px]:leading-[70px]">
          Terms of Service
        </h1>

        <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[186px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
          Welcome to <strong className="font-bold">Eligoleather.com</strong>. By
          accessing or using our website and purchasing our products, you agree
          to comply with and be bound by the following{" "}
          <strong className="font-bold">Terms of Service</strong>. These terms
          govern your use of our website, services, and any purchases made.
          Please read these terms carefully before proceeding.
        </p>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[276px]">
            General Information
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[352px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            This website is operated by{" "}
            <strong className="font-bold">Eligoleather</strong>. Throughout the
            site, the terms &quot;we,&quot; &quot;us,&quot; and &quot;our&quot; refer to{" "}
            <strong className="font-bold">Eligoleather</strong>. By visiting our
            site and/or purchasing something from us, you engage in our
            &quot;Service&quot; and agree to be bound by the following terms and
            conditions.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[442px]">
            Eligibility
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[518px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            By using our website and placing an order, you confirm that:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[568px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>You are at least 18 years of age.</li>
            <li>You are using this site for personal, non-commercial purposes.</li>
            <li>All information provided by you is accurate and up-to-date.</li>
          </ul>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[679px]">
            Products &amp; Services
          </h2>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[755px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Product Availability:</strong> We
              strive to ensure that the products displayed on our website are
              available. However, availability is not guaranteed, and we reserve
              the right to limit or discontinue any product at any time without
              notice.
            </p>
            <p>
              <strong className="font-bold">Product Descriptions:</strong> We
              make every effort to ensure that product descriptions, images, and
              prices are accurate. However, we do not guarantee that all content
              is free from errors, omissions, or inaccuracies.
            </p>
            <p>
              <strong className="font-bold">
                Custom &amp; Personalized Items:
              </strong>{" "}
              Some of our products may be customized or personalized. Once these
              orders are placed and production begins, they are final and cannot
              be canceled or returned, except for cases involving defects or
              errors on our part.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[965px]">
            Pricing &amp; Payment
          </h2>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1041px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Prices:</strong> All prices are
              listed in <strong className="font-bold">[currency]</strong> and
              may be subject to change without notice. The price at checkout is
              the final price.
            </p>
            <p>
              <strong className="font-bold">Payment:</strong> We accept various
              forms of payment, including major credit cards and third-party
              payment processors (e.g., PayPal, Stripe). Payment must be received
              in full before your order is processed and shipped.
            </p>
            <p>
              <strong className="font-bold">Promotions:</strong> Any discounts,
              promotions, or special offers are subject to their specific terms
              and conditions. We reserve the right to modify or cancel
              promotions at any time without prior notice.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1221px]">
            Order Processing &amp; Shipping
          </h2>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1297px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Order Confirmation: </strong>
              Once you place an order, you will receive a confirmation email.
              This email serves as an acknowledgment that we have received your
              order, but it does not guarantee acceptance. We reserve the right
              to cancel or refuse any order.
            </p>
            <p>
              <strong className="font-bold">Shipping:</strong> We aim to process
              and ship orders promptly. However, delivery times are estimates
              and may vary due to factors beyond our control. Eligoleather is not
              responsible for any delays caused by shipping carriers or customs
              processes.
            </p>
            <p>
              <strong className="font-bold">International Shipping:</strong>{" "}
              For international orders, you are responsible for paying any
              import duties, taxes, or customs fees applicable in your country.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1477px]">
            Returns &amp; Refunds
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1553px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            For information on returns and refunds, please refer to our{" "}
            <Link
              href="/refund-policy"
              className="font-bold text-black hover:underline"
            >
              Refund Policy
            </Link>
            , which is incorporated into these Terms of Service by reference.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1613px]">
            Intellectual Property
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1689px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            All content on this website, including but not limited to text,
            images, graphics, logos, and product descriptions, is the property of
            Eligoleather or our content suppliers and is protected by
            intellectual property laws.
            <br />
            You may not reproduce, distribute, or use any content from this
            website without our prior written consent.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1809px]">
            User-Generated Content
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1885px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            You may have the opportunity to submit reviews, comments, or other
            content on our website or social media channels. By submitting
            content, you agree to the following terms:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1965px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>
              You grant Eligoleather a non-exclusive, royalty-free, perpetual,
              and transferable license to use, modify, distribute, or display
              your content.
            </li>
            <li>
              You represent that the content you submit is your original work,
              does not violate any laws or rights of third parties, and is free
              of inappropriate, offensive, or harmful material.
            </li>
            <li>
              We reserve the right to remove or modify user-generated content at
              our discretion.
            </li>
          </ul>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2130px]">
            Privacy
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2206px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Your use of our website is also governed by our{" "}
            <Link
              href="/privacy-policy"
              className="font-bold text-black hover:underline"
            >
              Privacy Policy
            </Link>
            , which explains how we collect, use, and protect your personal
            information.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2272px]">
            Prohibited Conduct
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2348px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            When using our website, you agree not to:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2398px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>
              Use the site for any unlawful purpose or to solicit others to
              engage in unlawful activities.
            </li>
            <li>
              Violate any international, federal, or local laws, regulations, or
              ordinances.
            </li>
            <li>
              Interfere with or disrupt the security or functionality of the
              website.
            </li>
            <li>Submit false or misleading information.</li>
            <li>
              Transmit viruses, malware, or harmful code that may damage or
              affect the website.
            </li>
          </ul>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2563px]">
            Limitation of Liability
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2639px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Eligoleather is not liable for any direct, indirect, incidental, or
            consequential damages arising from your use of our website or
            products, including but not limited to lost profits, data loss, or
            personal injury.
            <br />
            We are not responsible for any damages resulting from the improper
            use of our products or any failure to follow care instructions.
            <br />
            In no case shall Eligoleather, its directors, officers, employees,
            or affiliates be liable for any claim, including but not limited to
            negligence or breach of contract, that exceeds the amount paid by
            you for the products purchased.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2819px]">
            Disclaimer of Warranties
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2895px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            All products and services provided through{" "}
            <strong className="font-bold">Eligoleather.com</strong> are provided
            &quot;as is&quot; and &quot;as available.&quot; We do not guarantee that
            the products or services will meet your expectations or that any
            defects will be corrected. To the fullest extent permitted by law,
            we disclaim any warranties, whether express or implied, including
            but not limited to warranties of merchantability and fitness for a
            particular purpose.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3015px]">
            Indemnification
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3091px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            You agree to indemnify, defend, and hold harmless{" "}
            <strong className="font-bold">Eligoleather</strong>, its directors,
            officers, employees, and affiliates from any claims, demands,
            liabilities, damages, or expenses (including attorney&apos;s fees)
            arising from your breach of these Terms of Service or your violation
            of any law or rights of a third party.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3181px]">
            Termination
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3257px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We reserve the right to terminate your access to our website or
            services at any time, without notice, if you violate these Terms of
            Service or engage in prohibited conduct. Upon termination, your
            right to use the website and any services will immediately cease.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3347px]">
            Governing Law
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3423px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            These Terms of Service shall be governed by and construed in
            accordance with the laws of{" "}
            <strong className="font-bold">[Your Country/State]</strong>, without
            regard to its conflict of law principles. Any legal action or
            proceeding arising out of or relating to these terms shall be
            brought exclusively in the courts of{" "}
            <strong className="font-bold">[Your Country/State].</strong>
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3513px]">
            Changes to the Terms of Service
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3589px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We reserve the right to update or modify these Terms of Service at
            any time without prior notice. Your continued use of the website
            following any changes constitutes your acceptance of the revised
            terms.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3679px]">
            Contact Us
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3755px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            If you have any questions or concerns about these Terms of Service,
            please contact us at:
          </p>

          <h3 className="text-2xl font-bold leading-9 min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3805px] min-[1800px]:w-[560px]">
            Eligoleather Customer Support
          </h3>

          <address className="text-lg font-normal not-italic leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[3861px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
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

