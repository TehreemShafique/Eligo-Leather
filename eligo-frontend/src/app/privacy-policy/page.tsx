import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { buildSeoMetadata } from "@/lib/seo"

export const metadata = buildSeoMetadata({ title: "Privacy Policy", description: "Learn how Eligo Leather collects, uses, stores and protects customer information when you browse our website, place orders or contact our support team.", path: "/privacy-policy", keywords: ["Eligo Leather privacy policy", "customer data protection"] })

export default function PrivacyPolicyPage() {
  return (
    <div className="relative left-1/2 w-[min(1920px,100vw)] -translate-x-1/2 bg-slate-50 font-['Manrope'] text-black">
      <div className="relative mx-auto w-full max-w-[1920px] space-y-10 px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:px-8 min-[1800px]:h-[2952px] min-[1800px]:overflow-hidden min-[1800px]:space-y-0 min-[1800px]:p-0">
        <PageBreadcrumb label="Privacy Policy" />

        <h1 className="text-5xl font-bold leading-tight text-amber-800 sm:text-6xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[76px] min-[1800px]:leading-[70px]">
          Privacy Policy
        </h1>

        <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[186px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
          At Eligoleather, we are committed to protecting your privacy and
          ensuring the security of your personal information. This Privacy
          Policy outlines how we collect, use, and protect the data you provide
          when using our website, <strong className="font-bold">Eligoleather.com</strong>,
          and our services. By accessing and using our website, you agree to the
          terms of this Privacy Policy.
        </p>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[306px]">
            Information We Collect
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[382px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We collect personal information that you provide directly to us when
            you:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[432px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>Make a purchase on our website</li>
            <li>Create an account</li>
            <li>Subscribe to our newsletter or promotional offers</li>
            <li>Contact our customer service team</li>
            <li>Engage with us on social media platforms</li>
          </ul>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[587px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            The personal information we may collect includes, but is not limited
            to:
          </p>

          <ul className="list-none text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[637px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            <li>Name</li>
            <li>Shipping and billing address</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Payment information (credit card details or other payment methods)</li>
            <li>Purchase history</li>
            <li>IP address and browsing behavior (collected automatically)</li>
          </ul>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[856px]">
            How We Use Your Information
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[932px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            The information we collect is used to provide, maintain, and improve
            our services, including:
          </p>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[982px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Order Processing: </strong>
              To process and fulfill your orders, send order confirmations, and
              provide shipping updates.
            </p>
            <p>
              <strong className="font-bold">Customer Support:</strong> To respond
              to your inquiries, offer assistance, and resolve any issues.
            </p>
            <p>
              <strong className="font-bold">Marketing &amp; Communication:</strong>{" "}
              To send you promotional emails, newsletters, or special offers if
              you have opted into these communications. You can opt out of
              marketing communications at any time.
            </p>
            <p>
              <strong className="font-bold">Improving User Experience:</strong>{" "}
              To analyze customer behavior and trends on our website, allowing
              us to enhance your shopping experience.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1147px]">
            How We Protect Your Information
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1223px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We take data protection and privacy seriously. To safeguard your
            personal information, we use the following security measures:
          </p>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1273px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Encryption:</strong> We use
              industry-standard SSL (Secure Socket Layer) encryption to protect
              your sensitive information during transactions.
            </p>
            <p>
              <strong className="font-bold">Secure Payment Processing:</strong>{" "}
              We do not store your payment information on our servers. All
              payment transactions are securely processed through trusted
              third-party payment processors.
            </p>
            <p>
              <strong className="font-bold">Restricted Access:</strong> Only
              authorized personnel have access to your personal information, and
              we take steps to ensure that your data is handled securely.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1411px]">
            Sharing Your Information
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1487px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Eligoleather does not sell, trade, or rent your personal information
            to third parties. However, we may share your information with:
          </p>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1537px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Service Providers: </strong>
              Trusted third-party companies that assist in operating our website,
              conducting our business, or servicing you (e.g., payment
              processors, shipping carriers). These providers only have access
              to the information necessary to perform their tasks and are
              required to keep your information confidential.
            </p>
            <p>
              <strong className="font-bold">Legal Obligations: </strong>
              We may disclose your information if required by law, such as to
              comply with legal obligations, protect our rights, or respond to
              lawful government requests.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1648px]">
            Your Rights
          </h2>

          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1724px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            You have the following rights regarding your personal information:
          </p>

          <div className="space-y-3 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1774px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              <strong className="font-bold">Access &amp; Correction: </strong>
              You may request access to the personal information we hold about
              you and ask us to update, correct, or delete it.
            </p>
            <p>
              <strong className="font-bold">Data Portability:</strong> You have
              the right to request a copy of your data in a structured,
              machine-readable format.
            </p>
            <p>
              <strong className="font-bold">Withdraw Consent:</strong> If you
              have given us consent to process your data for marketing purposes,
              you can withdraw that consent at any time.
            </p>
            <p>
              <strong className="font-bold">Opt-Out: </strong>
              You may opt-out of receiving marketing emails by following the
              unsubscribe instructions in our emails or by contacting us
              directly.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1912px]">
            Cookies &amp; Tracking Technologies
          </h2>

          <div className="space-y-4 text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[1988px] min-[1800px]:w-[1680px] min-[1800px]:space-y-0 min-[1800px]:leading-7">
            <p>
              Eligoleather uses cookies and similar tracking technologies to
              enhance your browsing experience, analyze website traffic, and
              personalize content. Cookies are small text files stored on your
              device when you visit our website.
            </p>
            <p className="min-[1800px]:mt-7">
              You may choose to disable cookies through your browser settings,
              but please note that doing so may limit your access to certain
              features of our website.
            </p>
          </div>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2138px]">
            Third-Party Links
          </h2>
          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2214px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Our website may contain links to third-party websites. Please note
            that this Privacy Policy does not apply to those websites, and we are
            not responsible for their privacy practices. We encourage you to
            review the privacy policies of any third-party sites you visit.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2304px]">
            Children&apos;s Privacy
          </h2>
          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2380px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            Eligoleather does not knowingly collect personal information from
            children under the age of 13. If we become aware that we have
            inadvertently collected such information, we will take steps to
            delete it promptly.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2470px]">
            Changes to This Privacy Policy
          </h2>
          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2546px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            We reserve the right to update or modify this Privacy Policy at any
            time. Any changes will be posted on this page, and we encourage you
            to review this policy periodically. Your continued use of our website
            after any modifications constitutes your acceptance of the updated
            Privacy Policy.
          </p>
        </section>

        <section className="space-y-4 min-[1800px]:contents">
          <h2 className="text-3xl font-bold leading-10 sm:text-4xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2636px]">
            Contact Us
          </h2>
          <p className="text-lg font-normal leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2712px] min-[1800px]:w-[1680px] min-[1800px]:leading-7">
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or your personal information, please contact us at:
          </p>
          <h3 className="text-2xl font-bold leading-9 min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2762px] min-[1800px]:w-[560px]">
            Eligoleather Customer Support
          </h3>
          <address className="text-lg font-normal not-italic leading-relaxed sm:text-xl min-[1800px]:absolute min-[1800px]:left-[120px] min-[1800px]:top-[2818px] min-[1800px]:w-[1192px] min-[1800px]:leading-7">
            Email:{" "}
            <a href="mailto:support@eligoleather.com" className="text-black hover:underline">
              support@eligoleather.com
            </a>
            <br />
            Phone:{" "}
            <a href="tel:0512745781" className="text-black hover:underline">
              051-2745781
            </a>
          </address>
        </section>
      </div>
    </div>
  )
}
