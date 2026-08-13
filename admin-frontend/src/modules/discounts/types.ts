export type DiscountStatus = "Active" | "Expired" | "Scheduled" | "Disabled"
export type DiscountMethod = "Code" | "Automatic"
export type DiscountEligibility = "All customers" | "Specific customers" | "Specific segments"
export type DiscountType = "Percentage" | "Fixed amount" | "Free shipping" | "Buy X get Y"

export interface Discount {
  id: number
  title: string
  code: string
  status: DiscountStatus
  method: DiscountMethod
  eligibility: DiscountEligibility
  type: DiscountType
  value: string
  combinations: string
  used_count: number
  created_at: string
  start_date?: string
  end_date?: string
  updated_at?: string
}
