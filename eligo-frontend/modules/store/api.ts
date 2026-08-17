import { api, getApiErrorMessage } from "@/lib/api-client"
import { DEFAULT_CURRENCY, NAV_LINKS, STORE_NAME } from "@/lib/constants"
import {
  HeaderScriptOutSchema,
  StoreBrandOutSchema,
  StoreSettingOutSchema,
  StorefrontConfigSchema,
  type StorefrontConfig,
} from "./schema"

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  storeName: STORE_NAME,
  slogan: null,
  logoUrl: null,
  currency: DEFAULT_CURRENCY,
  timezone: "UTC",
  country: null,
  nav: [...NAV_LINKS],
  headerScripts: "",
}

export async function fetchStorefrontConfig(): Promise<StorefrontConfig> {
  const [settingsResult, brandResult] = await Promise.allSettled([
    api.get("/settings/general/store-settings", { auth: false }),
    api.get("/settings/general/store-brand", { auth: false }),
  ])

  const config: StorefrontConfig = { ...DEFAULT_STOREFRONT_CONFIG }

  if (settingsResult.status === "fulfilled") {
    const parsed = StoreSettingOutSchema.safeParse(settingsResult.value)
    if (parsed.success) {
      config.storeName = parsed.data.store_name
      config.currency = parsed.data.currency
      config.timezone = parsed.data.timezone
      config.country = parsed.data.country
    }
  }

  if (brandResult.status === "fulfilled") {
    const parsed = StoreBrandOutSchema.safeParse(brandResult.value)
    if (parsed.success) {
      config.logoUrl = parsed.data.logo_url
      config.slogan = parsed.data.slogan
    }
  }

  return StorefrontConfigSchema.parse(config)
}

export async function fetchHeaderScripts(userId: number): Promise<string> {
  const script = await api.get(`/store/${userId}/header-scripts`, { auth: false })
  const parsed = HeaderScriptOutSchema.safeParse(script)
  return parsed.success ? parsed.data.header_scripts : ""
}

export function getStorefrontErrorMessage(error: unknown): string {
  return getApiErrorMessage(error)
}
