import type { Customer, Segment, Company } from "./types"

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    first_name: "Muhammad",
    last_name: "Ali",
    email: "m.ali@example.com",
    phone: "+92 334 5399470",
    location: "Islamabad, Pakistan",
    postal_code: "44000",
    email_subscription: true,
    sms_subscription: true,
    whatsapp_subscription: true,
    total_orders: 5,
    amount_spent: 18500,
    customer_language: "English",
    tax_exempt: false,
    deletable: true,
    mergeable: true,
    company_id: 1,
    company_name: "Apex Corporate Group",
    customer_added_date: "Jan 12, 2026",
    date_customer_updated: "Feb 8, 2026",
  },
  {
    id: 2,
    first_name: "Usman",
    last_name: "Tariq",
    email: "usman.tariq@gmail.com",
    phone: "+92 300 1234567",
    location: "Lahore, Pakistan",
    postal_code: "54000",
    email_subscription: true,
    sms_subscription: false,
    whatsapp_subscription: true,
    total_orders: 3,
    amount_spent: 12400,
    customer_language: "English",
    tax_exempt: false,
    deletable: true,
    mergeable: true,
    customer_added_date: "Jan 18, 2026",
    date_customer_updated: "Feb 8, 2026",
  },
  {
    id: 3,
    first_name: "Hamza",
    last_name: "Sheikh",
    email: "hamza.sheikh@hotmail.com",
    phone: "+92 321 8899001",
    location: "Rawalpindi, Pakistan",
    postal_code: "46000",
    email_subscription: false,
    sms_subscription: true,
    whatsapp_subscription: false,
    total_orders: 1,
    amount_spent: 2998,
    customer_language: "Urdu",
    tax_exempt: false,
    deletable: true,
    mergeable: true,
    customer_added_date: "Feb 1, 2026",
    date_customer_updated: "Feb 7, 2026",
  },
  {
    id: 4,
    first_name: "Ayesha",
    last_name: "Khan",
    email: "ayesha.k@yahoo.com",
    phone: "+92 312 4455667",
    location: "Karachi, Pakistan",
    postal_code: "75500",
    email_subscription: true,
    sms_subscription: true,
    whatsapp_subscription: true,
    total_orders: 8,
    amount_spent: 34200,
    customer_language: "English",
    tax_exempt: true,
    deletable: false,
    mergeable: false,
    company_id: 2,
    company_name: "Velox Solutions Ltd",
    customer_added_date: "Nov 15, 2025",
    date_customer_updated: "Feb 7, 2026",
  },
  {
    id: 5,
    first_name: "Bilal",
    last_name: "Hassan",
    email: "bilal.hassan@outlook.com",
    phone: "+92 333 9988776",
    location: "Peshawar, Pakistan",
    postal_code: "25000",
    email_subscription: true,
    sms_subscription: false,
    whatsapp_subscription: true,
    total_orders: 2,
    amount_spent: 6800,
    customer_language: "English",
    tax_exempt: false,
    deletable: true,
    mergeable: true,
    customer_added_date: "Jan 25, 2026",
    date_customer_updated: "Feb 5, 2026",
  },
]

export const MOCK_SEGMENTS: Segment[] = [
  {
    id: 1,
    name: "Customers who have purchased at least once",
    percentage_of_customers: 68.4,
    last_activity: "2 minutes ago",
    created_by: "Eligo Admin",
    filter_rules: "orders_count >= 1",
    customer_count: 971,
  },
  {
    id: 2,
    name: "VIP Repeat Buyers (3+ orders)",
    percentage_of_customers: 24.2,
    last_activity: "Today",
    created_by: "Eligo Admin",
    filter_rules: "orders_count >= 3 AND total_spent > 10000",
    customer_count: 344,
  },
  {
    id: 3,
    name: "Email & WhatsApp Subscribers",
    percentage_of_customers: 82.0,
    last_activity: "Yesterday",
    created_by: "System",
    filter_rules: "email_subscription = true OR whatsapp_subscription = true",
    customer_count: 1164,
  },
  {
    id: 4,
    name: "Un-purchased Cart Leads",
    percentage_of_customers: 12.5,
    last_activity: "Feb 6, 2026",
    created_by: "Growth Engine",
    filter_rules: "abandoned_cart = true AND orders_count = 0",
    customer_count: 177,
  },
]

export const MOCK_COMPANIES: Company[] = [
  {
    id: 1,
    company_name: "Apex Corporate Group",
    custom_pricing_tier: "Tier 1 Gold (15% Off)",
    net_payment_terms: "Net 30",
    assigned_customers_count: 4,
    total_purchases: 85000,
    created_at: "Jan 5, 2026",
  },
  {
    id: 2,
    company_name: "Velox Solutions Ltd",
    custom_pricing_tier: "Wholesale Tier (20% Off)",
    net_payment_terms: "Net 60",
    assigned_customers_count: 2,
    total_purchases: 142000,
    created_at: "Dec 10, 2025",
  },
  {
    id: 3,
    company_name: "Horizon Executive Gifting",
    custom_pricing_tier: "Corporate Preferred (10% Off)",
    net_payment_terms: "Net 15",
    assigned_customers_count: 6,
    total_purchases: 64000,
    created_at: "Jan 20, 2026",
  },
]

export async function listCustomers(): Promise<Customer[]> {
  return MOCK_CUSTOMERS
}

export async function getCustomer(id: number | string): Promise<Customer | undefined> {
  return MOCK_CUSTOMERS.find((c) => c.id.toString() === id.toString()) || MOCK_CUSTOMERS[0]
}

export async function listSegments(): Promise<Segment[]> {
  return MOCK_SEGMENTS
}

export async function listCompanies(): Promise<Company[]> {
  return MOCK_COMPANIES
}
