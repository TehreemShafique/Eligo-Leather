import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables: ${parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ")}`,
  );
}

export const env = parsed.data;

// Throws when a production SITE_URL is a loopback (localhost/127.0.0.1) value.
// Extracted as a pure, exported function so the guard is unit-testable in
// isolation (the top-level call below keeps identical runtime behavior).
export function assertProductionSiteUrl(raw: string): void {
  const normalized = raw.replace(/\/+$/, "").toLowerCase();
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be the real production URL; loopback values (localhost/127.0.0.1) are not allowed in production.",
    );
  }
}

// Local development may use the localhost fallback (non-production). In
// production we must never emit localhost canonicals/sitemap URLs, so a
// missing or loopback (localhost/127.0.0.1) NEXT_PUBLIC_SITE_URL is a build
// error rather than a silent misconfiguration.
if (process.env.NODE_ENV === "production") {
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }
  assertProductionSiteUrl(env.NEXT_PUBLIC_SITE_URL);
}
