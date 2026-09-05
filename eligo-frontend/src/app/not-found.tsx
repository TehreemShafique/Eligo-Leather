import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.errorContent}>
        <div className={styles.imageWrapper}>
          <Image
            src="/images/notFound.webp"
            alt="404 page not found illustration"
            width={610}
            height={410}
            sizes="(max-width: 768px) 100vw, 610px"
            className={styles.errorImage}
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>

        <h1>This page does not exist.</h1>

        <p>
          The page you are looking for doesn&apos;t exist or has been
          removed. You can either Return to Homepage or Explore Features.
        </p>

        <Link href="/" className={styles.homeButton}>
          Return to Homepage
        </Link>
      </div>
    </main>
  );
}
