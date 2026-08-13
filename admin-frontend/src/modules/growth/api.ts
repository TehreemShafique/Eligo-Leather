import type { GrowthOverviewSummary, AttributionRecord, CampaignRecord } from "./types"

export const MOCK_GROWTH_SUMMARY: GrowthOverviewSummary = {
  sales_attributed_to_marketing: 234100,
  total_store_sales: 276100,
  marketing_sales_percentage: 84.8,
  total_sessions: 42750,
  sessions_by_traffic_type: {
    organic: 14250,
    direct: 8900,
    social: 18400,
    referral: 1200,
  },
  total_orders_attributed: 113,
  total_ad_cost: 46000,
  average_roas: 5.08,
  average_cpa: 407,
}

export const MOCK_ATTRIBUTIONS: AttributionRecord[] = [
  {
    id: 1,
    channel: "Google Search",
    channel_name: "Google Search",
    type: "Organic",
    sessions: 14250,
    sales: 128500,
    orders: 52,
    conversion_rate: 3.65,
    cost: 22000,
    roas: 5.84,
    cpa: 423,
    ctr: 4.8,
    aov: 2471,
    orders_from_new_customers: 38,
    orders_from_returning_customers: 14,
    new_customer_orders: 38,
    returning_customer_orders: 14,
    referring_category: "Search Engines",
    referring_url: "google.com / google.com.pk",
    impressions: 125000,
    clicks: 6000,
  },
  {
    id: 2,
    channel: "Instagram & Facebook Ads",
    channel_name: "Instagram & Facebook Ads",
    type: "Social",
    sessions: 18400,
    sales: 94200,
    orders: 38,
    conversion_rate: 2.06,
    cost: 24000,
    roas: 3.92,
    cpa: 631,
    ctr: 3.2,
    aov: 2478,
    orders_from_new_customers: 31,
    orders_from_returning_customers: 7,
    new_customer_orders: 31,
    returning_customer_orders: 7,
    referring_category: "Social Media",
    referring_url: "instagram.com / facebook.com",
    impressions: 210000,
    clicks: 6720,
  },
  {
    id: 3,
    channel: "Direct Storefront Visitors",
    channel_name: "Direct Storefront Visitors",
    type: "Direct",
    sessions: 8900,
    sales: 42000,
    orders: 18,
    conversion_rate: 2.02,
    cost: 0,
    roas: 0,
    cpa: 0,
    ctr: 0,
    aov: 2333,
    orders_from_new_customers: 6,
    orders_from_returning_customers: 12,
    new_customer_orders: 6,
    returning_customer_orders: 12,
    referring_category: "Direct Entry",
    referring_url: "eligoleather.com",
    impressions: 8900,
    clicks: 8900,
  },
  {
    id: 4,
    channel: "chatgpt.com",
    channel_name: "chatgpt.com",
    type: "Referral",
    sessions: 1200,
    sales: 11400,
    orders: 5,
    conversion_rate: 4.16,
    cost: 0,
    roas: 0,
    cpa: 0,
    ctr: 0,
    aov: 2280,
    orders_from_new_customers: 5,
    orders_from_returning_customers: 0,
    new_customer_orders: 5,
    returning_customer_orders: 0,
    referring_category: "AI Assistants",
    referring_url: "chatgpt.com",
    impressions: 1200,
    clicks: 1200,
  },
]

export const MOCK_CHANNELS = MOCK_ATTRIBUTIONS

export const MOCK_CAMPAIGNS: CampaignRecord[] = [
  {
    id: 1,
    campaign_name: "Valentine's Leather Gift Collection 2026",
    title: "Valentine's Leather Gift Collection 2026",
    status: "Active",
    unassigned_activities_count: 2,
    touchpoints_count: 5,
    target_metrics: "ROAS > 4.5x, 50+ Conversions",
    created_at: "Jan 25, 2026",
    spent: 24000,
    budget: 35000,
    revenue_generated: 118000,
    target_conversion_rate: 4.5,
  },
  {
    id: 2,
    campaign_name: "Winter Clearance Sale - Keychains & Wallets",
    title: "Winter Clearance Sale - Keychains & Wallets",
    status: "Active",
    unassigned_activities_count: 0,
    touchpoints_count: 3,
    target_metrics: "Conversion Rate > 3.0%",
    created_at: "Jan 10, 2026",
    spent: 12000,
    budget: 15000,
    revenue_generated: 54000,
    target_conversion_rate: 3.2,
  },
  {
    id: 3,
    campaign_name: "B2B Corporate Executive Gifting Promo",
    title: "B2B Corporate Executive Gifting Promo",
    status: "Draft",
    unassigned_activities_count: 1,
    touchpoints_count: 2,
    target_metrics: "Target 10 Corporate Inquiries",
    created_at: "Feb 5, 2026",
    spent: 0,
    budget: 50000,
    revenue_generated: 0,
    target_conversion_rate: 2.0,
  },
]

export async function getGrowthOverview(): Promise<GrowthOverviewSummary> {
  return MOCK_GROWTH_SUMMARY
}

export async function listAttributions(): Promise<AttributionRecord[]> {
  return MOCK_ATTRIBUTIONS
}

export async function listChannels(): Promise<AttributionRecord[]> {
  return MOCK_CHANNELS
}

export async function listCampaigns(): Promise<CampaignRecord[]> {
  return MOCK_CAMPAIGNS
}
