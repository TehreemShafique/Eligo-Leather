export interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  location: string
  postal_code: string
  email_subscription: boolean
  sms_subscription: boolean
  whatsapp_subscription: boolean
  total_orders: number
  amount_spent: number
  customer_language: string
  tax_exempt: boolean
  deletable: boolean
  mergeable: boolean
  company_id?: number
  company_name?: string
  customer_added_date: string
  date_customer_updated: string
}

export interface Segment {
  id: number
  name: string
  percentage_of_customers: number
  last_activity: string
  created_by: string
  filter_rules: string
  customer_count: number
}

export interface Company {
  id: number
  company_name: string
  custom_pricing_tier: string
  net_payment_terms: string
  assigned_customers_count: number
  total_purchases: number
  created_at: string
}
