import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
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
