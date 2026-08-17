import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eligoleather.com'

  // Standard Storefront Static Routes
  const staticRoutes = [
    '',
    '/products',
    '/collections',
    '/collections/wallets',
    '/collections/belts',
    '/collections/bags',
    '/blogs',
    '/pages/about-us',
    '/pages/contact-us',
    '/pages/terms-of-service',
    '/pages/privacy-policy',
    '/pages/refund-policy',
    '/pages/avada-sitemap-blogs',
    '/pages/avada-sitemap-collections',
    '/pages/avada-sitemap-products',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }))

  return staticEntries
}
