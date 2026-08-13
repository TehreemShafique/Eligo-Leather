export interface GrowthOverviewSummary {
  sales_attributed_to_marketing: number
  total_store_sales: number
  marketing_sales_percentage: number
  total_sessions: number
  sessions_by_traffic_type: {
    organic: number
    direct: number
    social: number
    referral: number
  }
  total_orders_attributed: number
  total_ad_cost: number
  average_roas: number
  average_cpa: number
}

export interface AttributionRecord {
  id: number
  channel: string
  channel_name?: string
  type: "Organic" | "Paid Ads" | "Direct" | "Referral" | "Social" | "Unknown"
  sessions: number
  sales: number
  orders: number
  conversion_rate: number
  cost: number
  roas: number
  cpa: number
  ctr: number
  aov: number
  orders_from_new_customers: number
  orders_from_returning_customers: number
  new_customer_orders?: number
  returning_customer_orders?: number
  referring_category?: string
  referring_url?: string
  impressions: number
  clicks: number
}

export interface CampaignRecord {
  id: number
  campaign_name: string
  title?: string
  status: "Active" | "Draft" | "Completed" | "Paused"
  unassigned_activities_count: number
  touchpoints_count?: number
  target_metrics: string
  created_at: string
  spent?: number
  budget?: number
  revenue_generated?: number
  target_conversion_rate?: number
}
