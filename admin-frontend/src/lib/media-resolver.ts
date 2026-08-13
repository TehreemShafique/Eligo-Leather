/**
 * Dynamic Media Image Resolver for Eligo Leather
 * 
 * Logic:
 * 1. Default sample pictures are displayed by default across products, blogs, and branding pages.
 * 2. When images are uploaded or added from the Admin Panel (via /products/new, /content/files, 
 *    or Metafields/Metaobjects), the custom uploaded images automatically replace the default pictures.
 */

export function resolveProductImage(customUploadedImage?: string | null, defaultFallbackUrl?: string): string {
  if (customUploadedImage && customUploadedImage.trim().length > 0) {
    return customUploadedImage
  }
  return (
    defaultFallbackUrl ||
    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600"
  )
}

export function resolveBrandLogo(customLogoUrl?: string | null, defaultLogoUrl?: string): string {
  if (customLogoUrl && customLogoUrl.trim().length > 0) {
    return customLogoUrl
  }
  return defaultLogoUrl || "/logo.png"
}
