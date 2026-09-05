import { getStoredUser, StoredUser } from "./api"

export function currentUser(): StoredUser | null {
  return getStoredUser() as StoredUser | null
}

export function isAdminUser(): boolean {
  return !!currentUser()?.is_admin
}

export function currentDomain(): string | null {
  return currentUser()?.domain ?? null
}

export type Feature =
  | "users"
  | "security_logs"
  | "settings_store"
  | "discounts"

/**
 * Role-based access matrix based on the 3 RoleDomain values:
 * - organization (admin level): full access, plus user & security management.
 * - store (manager/staff): can manage discounts and store settings, but not
 *   users or security logs.
 * - point_of_sale (POS level): restricted to POS register only - cannot edit
 *   store settings nor manage users.
 *
 * User management & security logs are additionally gated by `is_admin` to stay
 * in sync with the backend `require_admin` dependency.
 */
export function canAccess(feature: Feature): boolean {
  const user = currentUser()
  if (!user) return false
  if (user.is_admin) return true

  switch (feature) {
    case "users":
    case "security_logs":
      return false
    case "discounts":
    case "settings_store":
      return user.domain === "organization" || user.domain === "store"
  }
}