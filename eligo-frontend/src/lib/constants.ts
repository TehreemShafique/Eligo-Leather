export const STORE_NAME = "Eligo Leather";

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_LOCALE = "en-US";

export const API_PREFIX = "/api/v1";

export const COOKIE_KEYS = {
  auth: "eligo_session",
  cart: "eligo_cart",
  market: "eligo_market",
} as const;

export const QUERY_KEYS = {
  storefront: "storefront",
  products: "products",
  categories: "categories",
  product: (slug: string) => ["products", slug],
  category: (slug: string) => ["categories", slug],
  cart: "cart",
  wishlist: "wishlist",
  orders: "orders",
} as const;

export const NAV_LINKS = [
  { label: "Shop", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
] as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 24,
  defaultSort: "featured",
} as const;

export const REVALIDATE_TAGS = {
  product: "product",
  category: "category",
  page: "page",
} as const;

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
