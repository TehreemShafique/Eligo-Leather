export type PaymentStatus = "Pending" | "Paid" | "Partially Paid" | "Refunded" | "Voided"
export type FulfillmentStatus = "Unfulfilled" | "Fulfilled" | "Partially Fulfilled" | "Restocked"
export type DeliveryStatus = "Processing" | "In Transit" | "Out for Delivery" | "Delivered" | "Failed"
export type DeliveryMethod = "Standard Shipping" | "Express Shipping" | "Local Pickup" | "Courier"

export interface OrderItem {
  id: number
  product_id?: number
  variant_id?: number
  product_name: string
  sku?: string
  variant_title?: string
  quantity: number
  unit_price: number
  total_price: number
  requires_shipping: boolean
  is_gift_card: boolean
}

export interface OrderNote {
  id: number
  order_id: number
  author_name?: string
  body: string
  is_customer_visible: boolean
  created_at: string
}

export interface OrderAuditLog {
  id: number
  order_id: number
  event_type: string
  description: string
  actor_name?: string
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  customer_id?: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  location_id?: number
  fulfill_by?: string
  cancelled_at?: string
  closed_at?: string
  channel: string
  currency: string
  subtotal: number
  shipping_cost: number
  tax: number
  total: number
  discount?: number
  paid_amount: number
  balance_due: number
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  delivery_status?: DeliveryStatus
  delivery_method?: DeliveryMethod
  tags?: string
  destination?: string
  po_number?: string
  shipping_address?: string
  billing_address?: string
  tracking_company?: string
  tracking_number?: string
  risk_level?: string
  is_archived: boolean
  created_at: string
  updated_at?: string
  items: OrderItem[]
  notes?: OrderNote[]
  audit_logs?: OrderAuditLog[]
}

export interface DraftOrder {
  id: number
  name: string
  customer_name: string
  total: number
  status: "Open" | "Invoice Sent" | "Completed"
  created_at: string
}

export interface AbandonedCheckout {
  id: number
  checkout_number: string
  customer_email: string
  items_count: number
  total: number
  recovery_status: "Not Recovered" | "Email Sent" | "Recovered"
  created_at: string
}
