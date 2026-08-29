import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export const dynamic = "force-dynamic"

// Shared secret used by the backend (or other trusted services) to trigger an
// on-demand cache purge so catalog changes (e.g. a product deletion) are
// reflected on the storefront immediately instead of waiting up to `revalidate`.
const EXPECTED_SECRET = process.env.REVALIDATE_SECRET || ""

export async function POST(request: NextRequest) {
  const supplied =
    request.headers.get("x-revalidate-secret") ||
    (await request.json().catch(() => ({}))).secret

  if (!EXPECTED_SECRET || supplied !== EXPECTED_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  try {
    revalidateTag("catalog", { expire: 0 })
    revalidatePath("/", "layout")
    return NextResponse.json({ ok: true, revalidated: true })
  } catch (err) {
    console.error("Revalidate error:", err)
    return NextResponse.json(
      { ok: false, error: "revalidate failed" },
      { status: 500 }
    )
  }
}
